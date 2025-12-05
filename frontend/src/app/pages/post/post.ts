import { Component, inject, NgModule, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PostResponse } from '../../models/global.model';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs';
import { PostService } from '../../services/post.service';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PostOptionsMenuComponent } from '../../share/PostOptionsMenu/post-options-menu';
import { TokenService } from '../../services/token.service';
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-post-page',
  imports: [
    CommonModule,
    FontAwesomeModule,
    PostOptionsMenuComponent,
    ConfirmDialogComponent,
    FormsModule,
    RouterLink
],
  providers: [PostService],
  templateUrl: './post.html',
  styleUrl: './post.css',
})
export class PostPage {
  faHeartRegular = faHeartRegular;
  faHeartSolid = faHeartSolid;

  showConfirm = false;
  postToDelete: PostResponse | null = null;
  postId!: string;
  post!: PostResponse;
  loading = true;
  currentUserId: string | null = '';
  newComment: string = '';

  postService = inject(PostService);

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  toggleLike(post: PostResponse) {
    if (post.likedByCurrentUser) {
      this.postService.unlikePost(post.id).subscribe(() => {
        post.likedByCurrentUser = false;
        post.likeCount--;
      });
    } else {
      this.postService.likePost(post.id).subscribe(() => {
        post.likedByCurrentUser = true;
        post.likeCount++;
      });
    }
  }

  ngOnInit(): void {
    this.currentUserId = this.tokenService.getUUID();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id')!;
          return this.postService.getPostById(id);
        })
      )
      .subscribe({
        next: (res) => {
          this.post = res;
          console.log('POST CONTENT', this.post);
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;

          console.log(err);
        },
      });
  }

  onUpdate(post: PostResponse) {
    console.log('Update Post', post.id);
    // this.router.navigate(['/update', post.id]);
  }

  onDelete(p: PostResponse) {
    this.postToDelete = p;
    this.showConfirm = true;
  }

  confirmDelete() {
    if (!this.postToDelete) return;

    // this.postService.deletePost(this.postToDelete.id).subscribe(() => {
    //   this.posts = this.posts.filter((x) => x.id !== this.postToDelete?.id);
    //   this.showConfirm = false;
    //   this.postToDelete = null;
    // });
  }

  cancelDelete() {
    this.showConfirm = false;
    this.postToDelete = null;
  }

  sendComment() {
    if (!this.newComment.trim()) return;

    this.postService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        this.post.comments.push(comment);
        this.newComment = '';
      },
      error: (err) => console.log(err),
    });
  }
}
