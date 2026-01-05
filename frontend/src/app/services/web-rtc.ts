// import { Injectable } from '@angular/core';
// import { Subject } from 'rxjs';
// import { WebSocketService } from './web-socket.service';

// export interface PeerData {
//   userId: string;
//   connection: RTCPeerConnection;
//   stream?: MediaStream;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class WebRTCService {
//   private localStream: MediaStream | null = null;
//   private peers: Map<string, PeerData> = new Map();

//   private currentStageId: string = '';
//   private myUserId: string = ''; // Added to track self

//   private rtcConfig: RTCConfiguration = {
//     iceServers: [
//       { urls: 'stun:stun1.l.google.com:19302' },
//       { urls: 'stun:stun2.l.google.com:19302' },
//     ],
//   };

//   public remoteStreams$ = new Subject<{ userId: string; stream: MediaStream }>();
//   public userLeft$ = new Subject<string>();

//   constructor(private wsService: WebSocketService) {
//     this.wsService.signalMessages$.subscribe((payload) => {
//       this.handleSignalMessage(payload);
//     });
//   }

//   async initAudio(): Promise<void> {
//     try {
//       this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
//     } catch (error) {
//       console.error('Error accessing microphone:', error);
//       throw error;
//     }
//   }

//   joinStage(stageId: string, myUserId: string) {
//     this.currentStageId = stageId;
//     this.myUserId = myUserId;
//     this.wsService.connect(stageId, myUserId);

//     setTimeout(() => {
//       this.wsService.sendSignal(stageId, { type: 'JOIN', senderId: myUserId });
//     }, 1000);
//   }

//   private async handleSignalMessage(message: any) {
//     const { type, senderId, sdp, candidate } = message;
//     if (!this.currentStageId || senderId === this.myUserId) return;

//     switch (type) {
//       case 'JOIN':
//         console.log(`User ${senderId} joined. Call initiated.`);
//         this.createPeerConnection(senderId, true, this.currentStageId);
//         break;

//       case 'OFFER':
//         await this.handleOffer(senderId, sdp, this.currentStageId);
//         break;

//       case 'ANSWER':
//         await this.handleAnswer(senderId, sdp);
//         break;

//       case 'ICE':
//         await this.handleCandidate(senderId, candidate);
//         break;

//       case 'LEAVE': // <--- ADD THIS CASE
//         this.removePeer(senderId);
//         break;
//     }
//   }

//   private createPeerConnection(
//     targetUserId: string,
//     isInitiator: boolean,
//     stageId: string
//   ): RTCPeerConnection {
//     if (this.peers.has(targetUserId)) return this.peers.get(targetUserId)!.connection;

//     const pc = new RTCPeerConnection(this.rtcConfig);
//     if (this.localStream) {
//       this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));
//     }

//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         this.wsService.sendSignal(stageId, {
//           type: 'ICE',
//           targetId: targetUserId,
//           senderId: this.myUserId,
//           candidate: event.candidate,
//         });
//       }
//     };

//     pc.ontrack = (event) => {
//       this.remoteStreams$.next({ userId: targetUserId, stream: event.streams[0] });
//     };

//     this.peers.set(targetUserId, { userId: targetUserId, connection: pc });
//     if (isInitiator) this.createOffer(pc, targetUserId, stageId);
//     return pc;
//   }

//   private async createOffer(pc: RTCPeerConnection, targetUserId: string, stageId: string) {
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     this.wsService.sendSignal(stageId, {
//       type: 'OFFER',
//       targetId: targetUserId,
//       senderId: this.myUserId,
//       sdp: offer.sdp,
//     });
//   }

//   private async handleOffer(senderId: string, sdp: string, stageId: string) {
//     const pc = this.createPeerConnection(senderId, false, stageId);
//     await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
//     const answer = await pc.createAnswer();
//     await pc.setLocalDescription(answer);
//     this.wsService.sendSignal(stageId, {
//       type: 'ANSWER',
//       targetId: senderId,
//       senderId: this.myUserId,
//       sdp: answer.sdp,
//     });
//   }

//   private async handleAnswer(senderId: string, sdp: string) {
//     const peer = this.peers.get(senderId);
//     // Only set remote description if we haven't yet (state is not stable)
//     if (peer && peer.connection.signalingState !== 'stable') {
//       await peer.connection.setRemoteDescription(
//         new RTCSessionDescription({ type: 'answer', sdp })
//       );
//     }
//   }

//   private async handleCandidate(senderId: string, candidate: RTCIceCandidateInit) {
//     const peer = this.peers.get(senderId);
//     if (peer) await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
//   }

//   toggleMute(isMuted: boolean) {
//     if (this.localStream) {
//       this.localStream.getAudioTracks().forEach((track) => (track.enabled = !isMuted));
//     }
//   }

//   private removePeer(userId: string) {
//     const peer = this.peers.get(userId);
//     if (peer) {
//       peer.connection.close();
//       this.peers.delete(userId);
//       this.userLeft$.next(userId); // Tell the component to remove the card
//     }
//   }

//   leaveStage() {
//     // Tell others I am leaving
//     if (this.currentStageId) {
//       this.wsService.sendSignal(this.currentStageId, { type: 'LEAVE', senderId: this.myUserId });
//     }

//     this.peers.forEach((p) => p.connection.close());
//     this.peers.clear();
//     if (this.localStream) this.localStream.getTracks().forEach((t) => t.stop());
//     this.wsService.disconnect();
//     this.currentStageId = '';
//   }
// }
