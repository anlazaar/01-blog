import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of, from } from 'rxjs';
import { concatMap, debounceTime, last, startWith, switchMap, tap } from 'rxjs/operators';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// TipTap Imports
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

// Services
import { PostService } from '../../services/post.service';
import { ToastService } from '../../services/toast.service';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    TiptapEditorDirective,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
  ],
  templateUrl: './add-post.html',
  styleUrls: ['./add-post.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPost implements OnInit, OnDestroy {
  // Dependencies
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  private readonly BACKEND_URL = 'http://localhost:8080';

  // --- LIMITS ---
  private readonly MAX_TAGS = 5;
  private readonly MAX_TAG_LENGTH = 20;

  // --- 1. STATE SIGNALS ---
  isSubmitting = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal('');
  editorMediaLoading = signal(false);

  // Tags State
  tags = signal<string[]>([]);

  // Edit Mode State
  isEditMode = signal(false);
  currentPostId = signal<string | null>(null);

  // Non-signal state
  editor!: Editor;
  existingMediaUrl: string | null = null;
  selectedFile: File | null = null;
  coverPreviewUrl: string | null = null;

  // --- 2. FORMS & AUTOCOMPLETE ---
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tagCtrl = new FormControl('');

  filteredTags = toSignal(
    this.tagCtrl.valueChanges.pipe(
      startWith(null),
      debounceTime(300),
      switchMap((value: string | null) => {
        if (value && value.length > 0) {
          const cleanVal = value.replace('#', '').toLowerCase();
          return this.postService.searchTags(cleanVal);
        } else {
          return of([]);
        }
      })
    ),
    { initialValue: [] }
  );

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;

  // Added strict Validators mapped to DTO requirements
  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50000)]], // description holds full body here
    mediaType: ['IMAGE'],
  });

  constructor() {
    // Safely subscribe to route params and ensure cleanup using takeUntilDestroyed
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          const id = params.get('id');
          if (id) {
            this.isEditMode.set(true);
            this.currentPostId.set(id);
            return this.postService.getPostMetadata(id);
          }
          return of(null);
        })
      )
      .subscribe((post) => {
        if (post) {
          this.populateForm(post);
        }
      });
  }

  private populateForm(post: any) {
    this.postForm.patchValue({
      title: post.title,
      description: '',
      mediaType: post.mediaType,
    });

    if (post.tags) {
      const parsedTags = Array.from(post.tags as string[]);
      this.tags.set(parsedTags.slice(0, this.MAX_TAGS));
    }

    if (post.mediaUrl) {
      this.existingMediaUrl = post.mediaUrl;
      this.coverPreviewUrl = this.BACKEND_URL + post.mediaUrl;
    }

    this.loadDraftContent(post.id);
  }

  ngOnInit(): void {
    this.editor = new Editor({
      extensions: [
        StarterKit,
        Image.configure({ inline: false, allowBase64: false }),
        Markdown.configure({ html: true, transformPastedText: true, transformCopiedText: true }),
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: 'Tell your story...' }),
      ],
      editorProps: { attributes: { class: 'medium-editor-content' } },
      onUpdate: ({ editor }) => {
        const markdown = (editor.storage as any).markdown.getMarkdown();
        this.postForm.patchValue({ description: markdown });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
    if (this.coverPreviewUrl && this.coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.coverPreviewUrl);
    }
  }

  // --- 5. TAG LOGIC (With Limits) ---

  private normalizeTag(tag: string): string {
    return tag.replace(/#/g, '').trim().toLowerCase();
  }

  addTag(event: MatChipInputEvent): void {
    if (this.autocompleteTrigger.panelOpen) return;

    const value = (event.value || '').trim();
    const cleanValue = this.normalizeTag(value);

    this.processTagAddition(cleanValue);

    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const rawValue = event.option.value;
    const cleanValue = this.normalizeTag(rawValue);

    this.processTagAddition(cleanValue);

    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  private processTagAddition(cleanValue: string) {
    if (!cleanValue) return;

    if (cleanValue.length > this.MAX_TAG_LENGTH) {
      this.toast.show(`Tags cannot exceed ${this.MAX_TAG_LENGTH} characters.`, 'error');
      return;
    }

    this.tags.update((current) => {
      if (current.length >= this.MAX_TAGS) {
        this.toast.show(`You can only add up to ${this.MAX_TAGS} tags.`, 'error');
        return current;
      }
      if (!current.includes(cleanValue)) {
        return [...current, cleanValue];
      }
      return current;
    });
  }

  removeTag(tag: string): void {
    this.tags.update((current) => current.filter((t) => t !== tag));
  }

  // --- 6. ACTIONS ---

  loadDraftContent(id: string) {
    this.postService.getFullPostContent(id).subscribe((content) => {
      if (this.editor) {
        this.editor.commands.setContent(content);
        this.postForm.patchValue({ description: content });
      }
    });
  }

  get isVideoType(): boolean {
    return this.postForm.get('mediaType')?.value === 'VIDEO';
  }

  setLink() {
    const previousUrl = this.editor.getAttributes('link')['href'];
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  triggerEditorImageInput() {
    document.getElementById('editor-image-upload')?.click();
  }

  onEditorFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadEditorMedia(input.files[0]);
      input.value = '';
    }
  }

  uploadEditorMedia(file: File) {
    this.editorMediaLoading.set(true);
    this.postService.uploadEditorMedia(file).subscribe({
      next: (res) => {
        this.editorMediaLoading.set(false);
        const fullUrl = `${this.BACKEND_URL}${res.url}`;
        this.editor.chain().focus().setImage({ src: fullUrl }).run();
      },
      error: () => {
        this.editorMediaLoading.set(false);
        this.toast.show('Failed to upload image.', 'error');
      },
    });
  }

  triggerFileInput() {
    document.getElementById('cover-upload')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const fileType = this.selectedFile.type;

      if (fileType.startsWith('video/')) {
        this.postForm.patchValue({ mediaType: 'VIDEO' });
        this.coverPreviewUrl = URL.createObjectURL(this.selectedFile);
      } else {
        this.postForm.patchValue({ mediaType: 'IMAGE' });
        const reader = new FileReader();
        reader.onload = (e) => (this.coverPreviewUrl = e.target?.result as string);
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  removeCover() {
    this.selectedFile = null;
    this.coverPreviewUrl = null;
    this.existingMediaUrl = null;
    this.postForm.patchValue({ mediaType: 'IMAGE' });
    const input = document.getElementById('cover-upload') as HTMLInputElement;
    if (input) input.value = '';
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // --- 7. SAVE / PUBLISH LOGIC ---

  onPublish() {
    this.handleSave(true);
  }
  onSaveDraft() {
    this.handleSave(false);
  }

  private handleSave(publish: boolean) {
    // Validate Form
    if (this.postForm.invalid) {
      if (this.postForm.get('title')?.hasError('maxlength')) {
        this.toast.show('Title is too long (max 150 characters).', 'error');
      } else if (this.postForm.get('description')?.hasError('maxlength')) {
        this.toast.show('Content is too long. Please reduce text.', 'error');
      } else {
        this.toast.show('Please provide a valid title and content.', 'error');
      }
      return;
    }

    if (this.editor.isEmpty) {
      this.toast.show('Please add some content to your story.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    const fullContent = this.postForm.get('description')?.value || '';
    // Description in DTO expects a summary. Limit this to 150 to be safe for typical DB limits
    const summary = fullContent.substring(0, 150) + '...';
    const title = this.postForm.get('title')?.value;
    const currentMediaType = this.postForm.get('mediaType')?.value;

    let saveObservable: Observable<any>;
    const currentId = this.currentPostId();

    if (this.isEditMode() && currentId) {
      // --- Update ---
      const updatePayload: any = {
        title: title,
        description: summary,
        mediaType: currentMediaType,
        mediaUrl: this.existingMediaUrl,
        tags: this.tags(),
      };

      let preUpdateAction: Observable<any> = of(null);

      if (this.selectedFile) {
        preUpdateAction = this.postService.uploadEditorMedia(this.selectedFile).pipe(
          tap((res) => {
            updatePayload.mediaUrl = res.url;
            this.existingMediaUrl = res.url;
          })
        );
      }

      saveObservable = preUpdateAction.pipe(
        concatMap(() => this.postService.updatePost(currentId, updatePayload)),
        concatMap(() => this.postService.clearPostContent(currentId))
      );
    } else {
      // --- Init ---
      const formData = new FormData();
      formData.append('title', title || '');
      formData.append('description', summary);
      formData.append('mediaType', currentMediaType || 'IMAGE');

      this.tags().forEach((tag) => {
        formData.append('tags', tag);
      });

      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      }

      saveObservable = this.postService.initPost(formData).pipe(
        tap((res: any) => {
          this.currentPostId.set(res.id);
          if (res.mediaUrl) {
            this.existingMediaUrl = res.mediaUrl;
          }
        })
      );
    }

    saveObservable
      .pipe(
        concatMap(() => this.uploadChunksSequentially(this.currentPostId()!, fullContent)),
        concatMap(() => {
          if (publish) {
            const totalChunks = Math.ceil(fullContent.length / 4000);
            return this.postService.publishPost(this.currentPostId()!, totalChunks);
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          if (publish) {
            this.toast.show('Story published successfully!', 'success');
            this.router.navigate(['/home']);
          } else {
            this.isEditMode.set(true);
            this.selectedFile = null;
            this.toast.show('Draft saved successfully', 'success');
          }
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Could not save story.', 'error');
          this.isSubmitting.set(false);
        },
      });
  }

  private uploadChunksSequentially(postId: string, content: string): Observable<any> {
    const CHUNK_SIZE = 4000;
    const totalChunks = Math.ceil(content.length / CHUNK_SIZE);
    const chunks: { index: number; content: string }[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, content.length);
      chunks.push({ index: i, content: content.substring(start, end) });
    }

    if (chunks.length === 0) return of(null);

    return from(chunks).pipe(
      concatMap((chunk, i) => {
        this.uploadProgress.set(Math.round(((i + 1) / totalChunks) * 100));
        return this.postService.uploadChunk(postId, chunk.index, chunk.content);
      }),
      last()
    );
  }
}
