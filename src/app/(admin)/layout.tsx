import AdminSidebar from '@/components/layout/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 bg-gray-50">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
