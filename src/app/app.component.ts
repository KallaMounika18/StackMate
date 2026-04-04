import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'StackMate';
  subtitle = 'Developer Toolkit';
  isProfileMenuOpen = false;
  sidebarCollapsed = false;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      this.sidebarCollapsed = savedState === 'true';
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const profileButton = document.querySelector('.profile-button');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileButton && profileDropdown) {
      if (!profileButton.contains(event.target as Node) && 
          !profileDropdown.contains(event.target as Node)) {
        this.isProfileMenuOpen = false;
      }
    }
  }

  getUserInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return 'U';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    } else if (firstName) {
      return firstName.charAt(0);
    } else if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUserValue;
    if (!user) return 'User';
    
    if (user.firstName) {
      return user.firstName;
    } else {
      return user.username;
    }
  }

  getUserFullName(): string {
    const user = this.authService.currentUserValue;
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else {
      return user.username;
    }
  }

  getUserEmail(): string {
    return "mohana.kalla@gmail.com";
    const user = this.authService.currentUserValue;
    return user.email || 'No email available';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed.toString());
  }
}