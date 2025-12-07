import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

import { from, Observable } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';

import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
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

  // Define your Backend URL here or import from environment
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
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Markdown.configure({
          html: true,
          transformPastedText: true,
          transformCopiedText: true,
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        Placeholder.configure({
          placeholder: 'Tell your story...',
        }),
      ],
      editorProps: {
        attributes: {
          class: 'medium-editor-content',
        },
      },
      onUpdate: ({ editor }) => {
        const markdown = (editor.storage as any).markdown.getMarkdown();
        this.postForm.patchValue({ description: markdown });
      },
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  // --- Toolbar Actions ---

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

  // --- EDITOR MEDIA UPLOAD ---

  triggerEditorImageInput() {
    document.getElementById('editor-image-upload')?.click();
  }

  triggerEditorVideoInput() {
    document.getElementById('editor-video-upload')?.click();
  }

  onEditorFileSelected(event: Event, type: 'image' | 'video') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // 1. Validate Size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('File is too large. Max size is 20MB.');
        input.value = '';
        return;
      }

      // 2. Validate Type
      if (type === 'image' && !file.type.startsWith('image/')) {
        alert('Invalid file type. Please select an image.');
        return;
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        alert('Invalid file type. Please select a video.');
        return;
      }

      this.uploadEditorMedia(file, type);
      input.value = '';
    }
  }

  uploadEditorMedia(file: File, type: 'image' | 'video') {
    this.editorMediaLoading = true;

    this.postService.uploadEditorMedia(file).subscribe({
      next: (res) => {
        this.editorMediaLoading = false;

        // FIX: Prepend Backend URL because res.url is relative (/uploads/...)
        const fullUrl = `${this.BACKEND_URL}${res.url}`;

        if (type === 'image') {
          this.editor.chain().focus().setImage({ src: fullUrl }).run();
        } else {
          const videoHtml = `
            <video src="${fullUrl}" controls style="width: 100%; border-radius: 4px; margin: 20px 0;"></video>
            <p></p> 
          `;
          this.editor.chain().focus().insertContent(videoHtml).run();
        }
      },
      error: (err) => {
        this.editorMediaLoading = false;
        console.error(err);
        alert('Failed to upload media.');
      },
    });
  }

  // --- COVER IMAGE ---

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'Cover Image too large (Max 10MB)';
        return;
      }
      this.selectedFile = file;
      this.errorMessage = '';
      const reader = new FileReader();
      reader.onload = (e) => (this.coverPreviewUrl = e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput() {
    document.getElementById('cover-upload')?.click();
  }

  removeCover() {
    this.selectedFile = null;
    this.coverPreviewUrl = null;
  }

  autoResize(event: Event) {
    const element = event.target as HTMLTextAreaElement;
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }

  // --- SUBMISSION ---

  onSubmit() {
    if (this.postForm.invalid) return;

    if (this.editor.isEmpty) {
      this.errorMessage = 'Please write some content.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.uploadProgress = 0;

    const fullContent = this.postForm.get('description')?.value || '';
    const summary = fullContent.substring(0, 150) + '...';

    const formData = new FormData();
    formData.append('title', this.postForm.get('title')?.value || '');
    formData.append('description', summary);
    formData.append('mediaType', 'IMAGE');
    if (this.selectedFile) {
      formData.append('media', this.selectedFile);
    }

    this.postService
      .initPost(formData)
      .pipe(
        concatMap((response: any) => {
          return this.uploadChunksSequentially(response.id, fullContent);
        })
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message || 'Failed to publish story';
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
      chunks.push({
        index: i,
        content: content.substring(start, end),
      });
    }

    if (chunks.length === 0) {
      return this.postService.publishPost(postId, 0);
    }

    return from(chunks).pipe(
      concatMap((chunk, i) => {
        this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
        return this.postService.uploadChunk(postId, chunk.index, chunk.content);
      }),
      last(),
      concatMap(() => this.postService.publishPost(postId, totalChunks))
    );
  }
}
