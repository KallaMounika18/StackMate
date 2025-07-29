import { Component, OnInit, HostListener } from '@angular/core';
import { PastebinService, PasteRequest, PasteResponse } from '../../services/pastebin.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pastebin',
  templateUrl: './pastebin.component.html',
  styleUrls: ['./pastebin.component.scss']
})
export class PastebinComponent implements OnInit {
  pasteText: string = '';
  pastes: PasteResponse[] = [];
  isLoading = false;
  errorMessage = '';
  isPublic = false;
  expirationHours = 0; // 0 means never expires

  constructor(
    private pastebinService: PastebinService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadPastes();
  }

  addPaste(): void {
    if (!this.pasteText.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';

    const pasteRequest: PasteRequest = {
      content: this.pasteText.trim(),
      isPublic: this.isPublic,
      expiresAt: this.expirationHours > 0 
        ? new Date(Date.now() + this.expirationHours * 60 * 60 * 1000).toISOString()
        : undefined
    };

    this.pastebinService.createPaste(pasteRequest).subscribe({
      next: (response) => {
        this.pastes.unshift(response);
        this.clearInput();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating paste:', error);
        this.errorMessage = 'Failed to create paste. Please try again.';
        this.isLoading = false;
      }
    });
  }

  deletePaste(pasteId: number): void {
    if (!confirm('Are you sure you want to delete this paste?')) {
      return;
    }

    this.pastebinService.deletePaste(pasteId).subscribe({
      next: () => {
        this.pastes = this.pastes.filter(paste => paste.id !== pasteId);
      },
      error: (error) => {
        console.error('Error deleting paste:', error);
        this.errorMessage = 'Failed to delete paste. Please try again.';
      }
    });
  }

  loadPastes(): void {
    this.pastebinService.getUserPastes().subscribe({
      next: (pastes) => {
        this.pastes = pastes;
      },
      error: (error) => {
        console.error('Error loading pastes:', error);
        this.errorMessage = 'Failed to load pastes.';
      }
    });
  }

  clearInput(): void {
    this.pasteText = '';
    this.isPublic = false;
    this.expirationHours = 0;
  }

  getTotalLines(): number {
    return this.pastes.reduce((total, paste) => total + paste.lineCount, 0);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard');
    });
  }

  copyShareLink(publicUrl: string): void {
    navigator.clipboard.writeText(publicUrl).then(() => {
      alert('🔗 Shareable link copied!');
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      this.addPaste();
    }
  }
}