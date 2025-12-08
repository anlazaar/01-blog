import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help.html',
  styleUrls: ['./help.css'],
})
export class HelpComponent {
  // Static data for display purposes
  categories = [
    { title: 'Getting Started', desc: 'Create an account and set up your profile.' },
    { title: 'Writing & Editing', desc: 'Formatting, images, and publishing stories.' },
    { title: 'Audience & Stats', desc: 'Understanding your readers and views.' },
    { title: 'Account & Settings', desc: 'Manage password, email, and privacy.' },
    { title: 'Rules & Policies', desc: 'Community guidelines and terms of service.' },
    { title: 'Safety & Reporting', desc: 'Block users and report content.' },
  ];
}
