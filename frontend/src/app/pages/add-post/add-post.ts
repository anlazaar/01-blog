import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  signal,
  effect,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of, from } from 'rxjs';
import { concatMap, debounceTime, last, startWith, switchMap, tap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
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

  // Non-signal state (Editor instance needs to be mutable object reference)
  editor!: Editor;
  existingMediaUrl: string | null = null;
  selectedFile: File | null = null;
  coverPreviewUrl: string | null = null;

  // --- 2. FORMS & AUTOCOMPLETE ---
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tagCtrl = new FormControl('');

  // Convert RxJS Autocomplete stream to Signal for easy template usage
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

  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    mediaType: ['IMAGE'],
  });

  constructor() {
    // --- 3. EFFECT: Handle Routing / Edit Mode ---
    effect(() => {
      // Create a signal from route params just for this effect context if needed,
      // or simply use the logic below. Since route params are observable,
      // we usually subscribe. However, here we can wrap it logic cleanly.
    });

    // We subscribe to route params manually here to trigger the load logic.
    // (Note: Using toSignal(route.paramMap) is also an option, but this logic
    // involves an API call chain that fits RxJS well).
    this.route.paramMap
      .pipe(
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

  // Helper to populate form data
  private populateForm(post: any) {
    this.postForm.patchValue({
      title: post.title,
      description: '', // Loaded via separate call
      mediaType: post.mediaType,
    });

    if (post.tags) {
      this.tags.set(Array.from(post.tags));
    }

    if (post.mediaUrl) {
      this.existingMediaUrl = post.mediaUrl;
      this.coverPreviewUrl = this.BACKEND_URL + post.mediaUrl;
    }

    // Load content separately
    this.loadDraftContent(post.id);
  }

  // --- 4. LIFECYCLE: EDITOR SETUP ---
  // We keep ngOnInit for Editor init as it relies on DOM presence/timing
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
    this.editor.destroy();
    if (this.coverPreviewUrl && this.coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.coverPreviewUrl);
    }
  }

  // --- 5. TAG LOGIC (Signal Based) ---

  private normalizeTag(tag: string): string {
    return tag.replace(/#/g, '').trim().toLowerCase();
  }

  addTag(event: MatChipInputEvent): void {
    if (this.autocompleteTrigger.panelOpen) return;

    const value = (event.value || '').trim();
    const cleanValue = this.normalizeTag(value);

    if (cleanValue) {
      this.tags.update((current) => {
        if (!current.includes(cleanValue)) {
          return [...current, cleanValue];
        }
        return current;
      });
    }

    event.chipInput!.clear();
    this.tagCtrl.setValue(null);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const rawValue = event.option.value;
    const cleanValue = this.normalizeTag(rawValue);

    if (cleanValue) {
      this.tags.update((current) => {
        if (!current.includes(cleanValue)) {
          return [...current, cleanValue];
        }
        return current;
      });
    }

    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  removeTag(tag: string): void {
    this.tags.update((current) => current.filter((t) => t !== tag));
  }

  // --- 6. ACTIONS ---

  loadDraftContent(id: string) {
    this.postService.getFullPostContent(id).subscribe((content) => {
      if (this.editor) {
        // Tiptap needs the queue to be empty or ready, usually safe here
        this.editor.commands.setContent(content);
        this.postForm.patchValue({ description: content });
      }
    });
  }

  get isVideoType(): boolean {
    return this.postForm.get('mediaType')?.value === 'VIDEO';
  }

  // ... Editor Actions (Links, Images) ...
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

  // ... Cover Logic ...
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
    if (this.postForm.invalid || this.editor.isEmpty) {
      this.toast.show('Please add a title and some content.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.uploadProgress.set(0);

    const fullContent = this.postForm.get('description')?.value || '';
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
        tags: this.tags(), // Access Signal value
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

      // Loop over Signal value
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
            this.router.navigate(['/']);
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
