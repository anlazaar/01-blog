import {
  Component,
  input,
  output,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-post-options-menu',
  standalone: true,
  imports: [RouterLink, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './post-options-menu.html',
  styleUrls: ['./post-options-menu.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostOptionsMenuComponent {
  postId = input.required<string>();

  canEdit = input(false);
  canReport = input(false);
  canArchieve = input(false)
  canUnarchieve = input(false)

  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();

  report = output<void>();
  delete = output<void>();
}
