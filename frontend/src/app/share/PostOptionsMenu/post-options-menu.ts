import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-post-options-menu',
  standalone: true,
  templateUrl: './post-options-menu.html',
  styleUrls: ['./post-options-menu.css'],
})
export class PostOptionsMenuComponent {
  @Input() canEdit: boolean = false;
  @Input() canReport: boolean = false;
  isOpen = false;

  @Output() report = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
