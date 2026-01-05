// import { Injectable } from '@angular/core';
// import { Client, Message } from '@stomp/stompjs';
// import { Subject } from 'rxjs';

// // FIX: Default import handles the "constructable" error
// import SockJS from 'sockjs-client';

// @Injectable({
//   providedIn: 'root',
// })
// export class WebSocketService {
//   // FIX: Added 'export' so other services can import it
//   private stompClient: Client | null = null;

//   // Observable to let components know when we receive a signal
//   public signalMessages$ = new Subject<any>();

//   constructor() {}

//   public connect(stageId: string, userId: string) {
//     // 1. Create the SockJS instance
//     const socket = new SockJS('http://localhost:8080/ws');

//     // 2. Configure STOMP
//     this.stompClient = new Client({
//       webSocketFactory: () => socket,
//       reconnectDelay: 5000,
//       debug: (str) => {
//         // Keep logs for debugging signaling, remove in prod
//         console.log(str);
//       },
//     });

//     // 3. Handle successful connection
//     this.stompClient.onConnect = (frame) => {
//       console.log('Connected to Stage Socket: ' + frame);

//       // Subscribe to public stage events (User Joined/Left)
//       this.stompClient?.subscribe(`/topic/stage/${stageId}`, (message: Message) => {
//         this.handleMessage(message);
//       });

//       // Subscribe to private signaling (WebRTC Offers meant for ME)
//       this.stompClient?.subscribe(`/topic/stage/${stageId}/user/${userId}`, (message: Message) => {
//         this.handleMessage(message);
//       });
//     };

//     // 4. Activate
//     this.stompClient.activate();
//   }

//   private handleMessage(message: Message) {
//     if (message.body) {
//       const payload = JSON.parse(message.body);
//       this.signalMessages$.next(payload);
//     }
//   }

//   public sendSignal(stageId: string, payload: any) {
//     if (this.stompClient && this.stompClient.connected) {
//       this.stompClient.publish({
//         destination: `/app/stage/${stageId}/signal`,
//         body: JSON.stringify(payload),
//       });
//     } else {
//       console.error('STOMP Client is not connected. Cannot send signal.');
//     }
//   }

//   public disconnect() {
//     if (this.stompClient) {
//       this.stompClient.deactivate();
//       console.log('Disconnected from Stage');
//     }
//   }
// }
