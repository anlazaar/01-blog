import {
  Component,
  input,
  output,
  ViewEncapsulation,
  ChangeDetectionStrategy,
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
  // encapsulation: ViewEncapsulation.None is often used for MatMenu styling overrides,
  // but be careful as it makes styles global. If it works for you, keep it.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostOptionsMenuComponent {
  // 1. INPUTS
  // Use input.required() for data that MUST be present.
  // This removes the need to handle 'null' in the template.
  postId = input.required<string>();

  // Optional flags with default values
  canEdit = input(false);
  canReport = input(false);

  // 2. OUTPUTS
  // Modern output() API replaces @Output() + EventEmitter
  report = output<void>();
  delete = output<void>();
}
