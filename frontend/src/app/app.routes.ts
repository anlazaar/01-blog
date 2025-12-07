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

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/login', component: Login, canActivate: [AuthGuard] },
  { path: 'auth/register', component: Register, canActivate: [AuthGuard] },
  { path: 'posts/:id', component: PostPage },
  { path: 'new-story', component: AddPost },
  { path: 'profile/:id', component: ProfilePage },
  { path: 'profile/complete-profile/:id', component: CompleteProfile },
  { path: 'profile/update/:id', component: UpdateProfile },
  { path: 'report/:id', component: ReportPage },
  { path: 'banned', component: BannedPageComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
];
