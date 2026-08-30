/* eslint-disable react-refresh/only-export-components -- icon barrel intentionally re-exports lucide components and sizing helpers. */
import type { LucideProps } from 'lucide-react';

import { AssetIcon } from './AssetIcon';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const iconSizeClass: Record<IconSize, string> = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-8',
};

export const getIconSizeClass = (size: IconSize = 'md') => iconSizeClass[size];

export type { LucideIcon, LucideProps } from 'lucide-react';

export {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Volume2,
  UserRound,
  Sliders,
  Settings,
  Link,
  Gauge,
  ArrowUpRight,
  Bell,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code,
  Coins,
  Copy,
  Crosshair,
  Download,
  Droplets,
  Edit3,
  ExternalLink,
  Eye,
  Github,
  GraduationCap,
  Heart,
  Home,
  Inbox,
  LayoutDashboard,
  Library,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Radio,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
  WifiOff,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

export { AssetIcon };
export type { AssetIconProps, SupportedAsset } from './AssetIcon';

export type AppIconProps = LucideProps;
