/**
 * Icon Component - Ant Design Icons Wrapper
 * 
 * Centralized icon component using @ant-design/icons.
 * All icons throughout the app should use this component.
 */

import {
  HomeOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CreditCardOutlined,
  DollarOutlined,
  MessageOutlined,
  CloseOutlined,
  DownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  AimOutlined,
  LoadingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownloadOutlined,
  UploadOutlined,
  LockOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  MenuOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';

// Icon name mapping from old names to Ant Design icons
const iconMap: Record<string, React.ComponentType<any>> = {
  Home: HomeOutlined,
  User: UserOutlined,
  TrendingUp: ArrowUpOutlined,
  TrendingDown: ArrowDownOutlined,
  CreditCard: CreditCardOutlined,
  DollarSign: DollarOutlined,
  Dollar: DollarOutlined,
  MessageCircle: MessageOutlined,
  X: CloseOutlined,
  Close: CloseOutlined,
  ChevronDown: DownOutlined,
  AlertTriangle: WarningOutlined,
  CheckCircle: CheckCircleOutlined,
  Zap: ThunderboltOutlined,
  Target: AimOutlined,
  Loader: LoadingOutlined,
  BarChart2: BarChartOutlined,
  LogOut: LogoutOutlined,
  Logout: LogoutOutlined,
  Eye: EyeOutlined,
  EyeOff: EyeInvisibleOutlined,
  Download: DownloadOutlined,
  Upload: UploadOutlined,
  Lock: LockOutlined,
  Info: InfoCircleOutlined,
  Dashboard: DashboardOutlined,
  Menu: MenuOutlined,
  Plus: PlusOutlined,
  Settings: SettingOutlined,
};

type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
  color?: string;
  [key: string]: any; // Allow other props to pass through
}

export const Icon = ({
  name,
  size = 18,
  className = '',
  color,
  ...props
}: IconProps) => {
  const AntIcon = iconMap[name];
  
  if (!AntIcon) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  const iconSize = typeof size === 'string' ? parseInt(size) : size;
  const style = {
    fontSize: iconSize,
    color: color,
    ...props.style,
  };

  return (
    <AntIcon 
      className={className}
      style={style}
      {...props}
    />
  );
};

export default Icon;
