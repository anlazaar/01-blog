import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SuggestedUsersComponent } from '../SuggestedAccounts/suggested-users';
import { PopularTagsComponent } from '../popular-tags/popular-tags';

@Component({
  selector: 'app-right-sidebar',
  standalone: true,
  imports: [PopularTagsComponent, SuggestedUsersComponent],
  templateUrl: './right-sidebar.html',
  styleUrls: ['./right-sidebar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RightSidebarComponent {}
