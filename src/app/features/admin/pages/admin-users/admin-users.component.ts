import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUserResponse } from '../../models/admin.models';
import { UserProfileService } from '../../../profile/services/user-profile.service';
import { SavedAddress, UserProfile } from '../../../profile/models/user-profile.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly profileService = inject(UserProfileService);

  readonly users = signal<AdminUserResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  readonly currentUser = signal<UserProfile | null>(null);

  // User details drawer state
  readonly selectedUser = signal<AdminUserResponse | null>(null);
  readonly selectedUserAddresses = signal<SavedAddress[]>([]);
  readonly isLoadingAddresses = signal(false);

  // Confirm delete
  readonly confirmDeleteId = signal<number | null>(null);

  // Action in-progress per user id
  readonly actionInProgress = signal<Set<number>>(new Set());

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    return this.users().filter((u) => {
      const matchesStatus =
        status === 'ALL' || u.status === status;
      const matchesQuery =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.profileService.getCurrentUser().subscribe({
      next: (profile) => this.currentUser.set(profile),
      error: () => {}
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.adminService.getUsers(0, 100).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load users. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  setStatus(status: 'ALL' | 'ACTIVE' | 'INACTIVE'): void {
    this.statusFilter.set(status);
  }

  deactivate(user: AdminUserResponse): void {
    this.markInProgress(user.id);
    this.adminService.deactivateUser(user.id).subscribe({
      next: (updated) => this.replaceUser(updated),
      error: () => this.clearInProgress(user.id),
    });
  }

  reactivate(user: AdminUserResponse): void {
    this.markInProgress(user.id);
    this.adminService.reactivateUser(user.id).subscribe({
      next: (updated) => this.replaceUser(updated),
      error: () => this.clearInProgress(user.id),
    });
  }

  confirmDelete(id: number): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  executeDelete(id: number): void {
    this.confirmDeleteId.set(null);
    this.markInProgress(id);
    this.adminService.deleteUser(id).subscribe({
      next: () => this.users.update((list) => list.filter((u) => u.id !== id)),
      error: () => this.clearInProgress(id),
    });
  }

  private replaceUser(updated: AdminUserResponse): void {
    this.users.update((list) =>
      list.map((u) => (u.id === updated.id ? updated : u))
    );
    this.clearInProgress(updated.id);
  }

  private markInProgress(id: number): void {
    this.actionInProgress.update((set) => new Set([...set, id]));
  }

  private clearInProgress(id: number): void {
    this.actionInProgress.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  isInProgress(id: number): boolean {
    return this.actionInProgress().has(id);
  }

  viewUserDetails(user: AdminUserResponse): void {
    this.selectedUser.set(user);
    this.selectedUserAddresses.set([]);
    this.isLoadingAddresses.set(true);

    this.adminService.getUserAddresses(user.id).subscribe({
      next: (addresses) => {
        this.selectedUserAddresses.set(addresses);
        this.isLoadingAddresses.set(false);
      },
      error: () => {
        this.isLoadingAddresses.set(false);
      }
    });
  }

  closeDetails(): void {
    this.selectedUser.set(null);
    this.selectedUserAddresses.set([]);
  }

  readonly isSelf = computed(() => {
    const sel = this.selectedUser();
    const cur = this.currentUser();
    return sel && cur && sel.id === cur.id;
  });
}
