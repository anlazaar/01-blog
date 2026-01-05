import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { PostPage } from './pages/post/post';
import { AuthGuard } from './core/guards/auth.guard';
import { CompleteProfile } from './pages/CompleteProfile/completeProfile';
import { ProfilePage } from './pages/profile/profile.component';
import { UpdateProfile } from './pages/updateProfile/updateProfile';
import { ReportPage } from './pages/report/reportPage';
import { BannedPageComponent } from './share/BannedPageComponent/BannedPageComponent';
import { AdminGuard } from './core/guards/admin.guard';
import { AdminDashboardComponent } from './pages/admin/adminDashboard/dashboard';
import { AddPost } from './pages/add-post/add-post';
// 1. Import the Privacy Page
import { PrivacyPage } from './pages/privacy/privacy';
import { HelpComponent } from './pages/help/help';
import { NotFoundComponent } from './pages/not-found/not-found';
import { UsersPageComponent } from './pages/UsersPage/users-page';
import { DraftsComponent } from './pages/drafts/drafts';
import { SavedPostsComponent } from './pages/saved-posts/saved-posts';
import { AuthCallbackComponent } from './auth/AuthCallbackComponent';
// import { StageRoom } from './pages/stage-room/stage-room';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: Login, canActivate: [AuthGuard] },
  { path: 'auth/register', component: Register, canActivate: [AuthGuard] },
  { path: 'posts/:id', component: PostPage },
  { path: 'profile/:id', component: ProfilePage },
  { path: 'profile/complete-profile/:id', component: CompleteProfile },
  { path: 'profile/update/:id', component: UpdateProfile },
  { path: 'report/:id', component: ReportPage },
  { path: 'banned', component: BannedPageComponent },
  { path: 'writers', component: UsersPageComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'new-story', component: AddPost },
  { path: 'p/:id/edit', component: AddPost },
  { path: 'me/drafts', component: DraftsComponent },
  { path: 'me/saved', component: SavedPostsComponent },

  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'help', component: HelpComponent },
  { path: 'privacy', component: PrivacyPage },
  // { path: 'stages/:id', component: StageRoom },

  { path: '**', component: NotFoundComponent },
];
