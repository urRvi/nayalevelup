import {
  LuLayoutDashboard,
  LuHandCoins,
  LuWalletMinimal,
  LuLogOut,
} from "react-icons/lu";
import { FaApple } from "react-icons/fa";


export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "02",
    label: "Income",
    icon: LuWalletMinimal,
    path: "/income",
  },
  {
    id: "03",
    label: "Expense",
    icon: LuHandCoins,
    path: "/expense",
  },
  {
    id: "04",
    label: "Calorie Tracker",
    icon: FaApple,
    path: "/dashboard/calories",
  },
  {
    id: "06", // ID can remain 06 or be changed to 05 if we want to keep them sequential
    label: "Logout",
    icon: LuLogOut,
    path: "logout",
  },
];
