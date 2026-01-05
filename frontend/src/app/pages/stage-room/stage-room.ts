// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { WebRTCService } from '../../services/web-rtc';
// import { MatIconModule } from '@angular/material/icon';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-stage-room',
//   standalone: true,
//   imports: [MatIconModule, CommonModule],
//   templateUrl: './stage-room.html', // Ensure file exists
//   styleUrls: ['./stage-room.css'], // Ensure file exists
// })
// export class StageRoom implements OnInit, OnDestroy {
//   stageId: string = '';
//   stageTitle = 'Live Stage';
//   stageDescription = 'Discussion in progress...';

//   currentUser: any;
//   isMuted = false;
//   isSpeaking = false;
//   remoteParticipants: Array<{ userId: string; stream: MediaStream }> = [];

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private rtcService: WebRTCService
//   ) {
//     // 1. PERSISTENT ID LOGIC
//     // Check if we already have a fake ID in storage
//     const storedUser = localStorage.getItem('stage_user');

//     if (storedUser) {
//       this.currentUser = JSON.parse(storedUser);
//     } else {
//       // Create new one and save it
//       this.currentUser = {
//         id: crypto.randomUUID(),
//         username: 'User_' + Math.floor(Math.random() * 1000),
//         avatarUrl: null,
//       };
//       localStorage.setItem('stage_user', JSON.stringify(this.currentUser));
//     }
//   }

//   async ngOnInit() {
//     this.stageId = this.route.snapshot.paramMap.get('id') || '';

//     try {
//       await this.rtcService.initAudio();
//     } catch (e) {
//       alert('Microphone access is required to join.');
//       return;
//     }

//     if (this.stageId) {
//       this.rtcService.joinStage(this.stageId, this.currentUser.id);
//     }

//     // Subscribe to new streams
//     this.rtcService.remoteStreams$.subscribe((data) => {
//       this.addRemoteAudio(data.userId, data.stream);
//     });

//     // Subscribe to user leaving
//     this.rtcService.userLeft$.subscribe((userId) => {
//       this.removeRemoteParticipant(userId);
//     });
//   }

//   toggleMute() {
//     this.isMuted = !this.isMuted;
//     this.rtcService.toggleMute(this.isMuted);
//   }

//   addRemoteAudio(userId: string, stream: MediaStream) {
//     if (!userId) return;
//     if (this.remoteParticipants.find((p) => p.userId === userId)) return;

//     // Create Audio Element
//     const audio = document.createElement('audio');
//     audio.srcObject = stream;
//     audio.autoplay = true;
//     audio.id = `audio-${userId}`; // Give it an ID to remove later
//     document.body.appendChild(audio);

//     // Try to play immediately (handles some autoplay policies)
//     audio.play().catch((e) => console.log('Autoplay blocked, user must interact'));

//     this.remoteParticipants.push({ userId, stream });
//   }

//   removeRemoteParticipant(userId: string) {
//     // Remove from UI list
//     this.remoteParticipants = this.remoteParticipants.filter((p) => p.userId !== userId);

//     // Remove audio element from DOM
//     const audio = document.getElementById(`audio-${userId}`);
//     if (audio) audio.remove();
//   }

//   leaveStage() {
//     this.rtcService.leaveStage();
//     this.router.navigate(['/']);
//   }

//   ngOnDestroy() {
//     this.leaveStage();
//   }
// }
