import CustomerHeader from '@/components/layout/customer-header';
import CustomerFooter from '@/components/layout/customer-footer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <CustomerHeader />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </div>
  );
}
