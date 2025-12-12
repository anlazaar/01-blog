import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None // Required to style the popup menu
})
export class PostOptionsMenuComponent {
  @Input() postId: string | null = null;
  @Input() canEdit: boolean = false;
  @Input() canReport: boolean = false;

  @Output() report = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}