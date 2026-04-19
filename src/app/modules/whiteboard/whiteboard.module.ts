import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { WhiteboardBridgeService } from './services/whiteboard-bridge.service';
import { WhiteboardStorageService } from './services/whiteboard-storage.service';
import { WhiteboardComponent } from './whiteboard.component';
import { WhiteboardRoutingModule } from './whiteboard-routing.module';

@NgModule({
  declarations: [
    WhiteboardComponent
  ],
  imports: [
    SharedModule,
    WhiteboardRoutingModule
  ],
  providers: [
    WhiteboardBridgeService,
    WhiteboardStorageService
  ]
})
export class WhiteboardModule { }
