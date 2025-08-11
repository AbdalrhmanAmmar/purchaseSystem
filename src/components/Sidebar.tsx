import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Truck,
  BarChart3,
  Settings,
  Calculator,
  CreditCard,
  Database,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Package },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Shipping", href: "/shipping", icon: Truck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Accounting", href: "/accounting", icon: Calculator },
  { name: "Banking", href: "/banking", icon: CreditCard },
  { name: "Seed Data", href: "/seed-data", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [open, setOpen] = useState<boolean>(true);
  const location = useLocation();

  const ToggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white border-r transition-all duration-300",
        open ? "w-64" : "w-4"
      )}
    >
<div
  className={cn(
    "flex h-16 px-4 border-b transition-all duration-300",
    open ? "items-center justify-between" : "items-center justify-center"
  )}
>
  {open && (
    <h1 className="text-xl font-bold text-gray-900 transition-opacity duration-300">
      BrokerPro
    </h1>
  )}
  <button type="button" onClick={ToggleSidebar}>
    {!open ? (
      <X className="w-5 h-5 text-gray-600" />
    ) : (
      <Menu className="w-3 h-3 text-gray-600" />
    )}
  </button>
</div>


      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <>

            {open&&(
                   <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center py-2 px-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {open && (
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 mr-3",
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
              )}

              {!open && (
                <div className="w-5 h-5 d-none">
                  {/* Optional: empty box to preserve spacing */}
                </div>
              )}

              {open && <span className="truncate">{item.name}</span>}
            </Link>
              
            )}
           
            
            </>
            
        
          );
        })}
      </nav>
    </div>
  );
}
