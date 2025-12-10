import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { PostService } from '../../services/post.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Observable, of, from } from 'rxjs';
import { concatMap, last, switchMap, tap } from 'rxjs/operators';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
import { ToastService } from '../../services/toast.service';
import Image from '@tiptap/extension-image';
import {
  faBold,
  faItalic,
  faHeading,
  faQuoteLeft,
  faListUl,
  faListOl,
  faImage,
  faVideo,
  faArrowLeft,
  faCode,
  faStrikethrough,
  faLink,
  faUnlink,
  faMinus,
  faUndo,
  faRedo,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-add-post',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FontAwesomeModule, TiptapEditorDirective],
  templateUrl: './add-post.html',
  styleUrls: ['./add-post.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPost implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  private readonly BACKEND_URL = 'http://localhost:8080';

  // Icons
  faBold = faBold;
  faItalic = faItalic;
  faHeading = faHeading;
  faQuote = faQuoteLeft;
  faListUl = faListUl;
  faListOl = faListOl;
  faImage = faImage;
  faVideo = faVideo;
  faArrowLeft = faArrowLeft;
  faCode = faCode;
  faStrike = faStrikethrough;
  faLink = faLink;
  faUnlink = faUnlink;
  faMinus = faMinus;
  faUndo = faUndo;
  faRedo = faRedo;

  editor!: Editor;
  isSubmitting = false;
  uploadProgress = 0;
  errorMessage = '';
  editorMediaLoading = false;

  isEditMode = false;
  postId: string | null = null;
  existingMediaUrl: string | null = null;

  postForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    mediaType: ['IMAGE'],
  });

  selectedFile: File | null = null;
  coverPreviewUrl: string | null = null;

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

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (id) {
            this.isEditMode = true;
            this.postId = id;
            return this.postService.getPostMetadata(id);
          }
          return of(null);
        })
      )
      .subscribe((post) => {
        if (post) {
          this.postForm.patchValue({
            title: post.title,
            description: '',
            mediaType: post.mediaType,
          });
          if (post.mediaUrl) {
            this.existingMediaUrl = post.mediaUrl;
            this.coverPreviewUrl = this.BACKEND_URL + post.mediaUrl;
          }
          this.loadDraftContent(post.id);
        }
      });
  }

  loadDraftContent(id: string) {
    this.postService.getFullPostContent(id).subscribe((content) => {
      if (this.editor) {
        this.editor.commands.setContent(content);
        this.postForm.patchValue({ description: content });
      }
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  // --- Toolbar & Media Logic ---
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
  triggerEditorVideoInput() {
    document.getElementById('editor-video-upload')?.click();
  }

  onEditorFileSelected(event: Event, type: 'image' | 'video') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadEditorMedia(input.files[0], type);
      input.value = '';
    }
  }

  uploadEditorMedia(file: File, type: 'image' | 'video') {
    this.editorMediaLoading = true;
    this.postService.uploadEditorMedia(file).subscribe({
      next: (res) => {
        this.editorMediaLoading = false;
        const fullUrl = `${this.BACKEND_URL}${res.url}`;
        if (type === 'image') {
          this.editor.chain().focus().setImage({ src: fullUrl }).run();
        } else {
          const videoHtml = `<video src="${fullUrl}" controls style="width: 100%; border-radius: 4px; margin: 20px 0;"></video><p></p>`;
          this.editor.chain().focus().insertContent(videoHtml).run();
        }
      },
      error: () => {
        this.editorMediaLoading = false;
        this.toast.show('Failed to upload media. Please try a smaller file.', 'error');
      },
    });
  }

  // --- Cover Image Logic ---
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => (this.coverPreviewUrl = e.target?.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  triggerFileInput() {
    document.getElementById('cover-upload')?.click();
  }

  removeCover() {
    this.selectedFile = null;
    this.coverPreviewUrl = null;
    this.existingMediaUrl = null;
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // --- SAVE & PUBLISH LOGIC ---
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

    this.isSubmitting = true;
    this.errorMessage = '';
    this.uploadProgress = 0;

    const fullContent = this.postForm.get('description')?.value || '';
    const summary = fullContent.substring(0, 150) + '...';
    const title = this.postForm.get('title')?.value;

    let saveObservable: Observable<any>;

    if (this.isEditMode && this.postId) {
      // === EDIT MODE ===
      const updatePayload = {
        title: title,
        description: summary,
        mediaType: 'IMAGE',
        mediaUrl: this.existingMediaUrl, // Use stored URL
      };

      let preUpdateAction: Observable<any> = of(null);

      if (this.selectedFile) {
        preUpdateAction = this.postService.uploadEditorMedia(this.selectedFile).pipe(
          tap((res) => {
            updatePayload.mediaUrl = res.url;
            this.existingMediaUrl = res.url; // <--- FIX 1: Update local state
          })
        );
      }

      saveObservable = preUpdateAction.pipe(
        concatMap(() => this.postService.updatePost(this.postId!, updatePayload)),
        concatMap(() => this.postService.clearPostContent(this.postId!))
      );
    } else {
      // === CREATE MODE ===
      const formData = new FormData();
      formData.append('title', title || '');
      formData.append('description', summary);
      formData.append('mediaType', 'IMAGE');
      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      }

      saveObservable = this.postService.initPost(formData).pipe(
        tap((res: any) => {
          this.postId = res.id;
          // <--- FIX 2: Capture new URL immediately so next save doesn't delete it
          if (res.mediaUrl) {
            this.existingMediaUrl = res.mediaUrl;
          }
        })
      );
    }

    // === EXECUTE ===
    saveObservable
      .pipe(
        concatMap(() => this.uploadChunksSequentially(this.postId!, fullContent)),
        concatMap(() => {
          if (publish) {
            const totalChunks = Math.ceil(fullContent.length / 4000);
            return this.postService.publishPost(this.postId!, totalChunks);
          }
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          if (publish) {
            this.toast.show('Story published successfully!', 'success');
            this.router.navigate(['/']);
          } else {
            this.isEditMode = true;
            this.selectedFile = null; // Clear file input after successful upload
            this.toast.show('Draft saved successfully', 'success');
          }
        },
        error: (err) => {
          console.error(err);
          this.toast.show('Could not save story.', 'error');
          this.isSubmitting = false;
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
        this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
        return this.postService.uploadChunk(postId, chunk.index, chunk.content);
      }),
      last()
    );
  }
}
