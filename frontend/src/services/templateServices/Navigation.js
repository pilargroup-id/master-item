import {
  Chart01,
  Edit03,
  FileText01,
  LayoutDashboard,
  LogOut01,
  Settings01,
  Table01,
  Ticket01,
  Users01,
} from '../../components/template/TemplateIcons.jsx'

export const defaultNavigationPath = '/dashboard'

export const implementedNavigationPaths = [
  '/dashboard',
  '/parents',
  '/variants',
  '/bundles',
  '/master/pic-categories',
  '/master/item-types',
  '/master/ports',
  '/master/uoms',
  '/master/brands',
  '/master/pics',
]

export const primaryNavigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Item Management',
    icon: Table01,
    children: [
      { label: 'Parent Items',   href: '/parents',  icon: FileText01 },
      { label: 'Variant Items',  href: '/variants', icon: Edit03     },
      { label: 'Bundling Items', href: '/bundles',  icon: Ticket01   },
    ],
  },
  {
    label: 'Master Data',
    icon: Settings01,
    children: [
      { label: 'Category PIC', href: '/master/pic-categories', icon: Users01   },
      { label: 'Item Types',   href: '/master/item-types',     icon: Table01   },
      { label: 'Ports',        href: '/master/ports',          icon: Chart01   },
      { label: 'UOMs',         href: '/master/uoms',           icon: Edit03    },
      { label: 'Brands',       href: '/master/brands',         icon: Ticket01  },
      { label: 'List PIC',     href: '/master/pics',           icon: Users01   },
    ],
  },
]

export const secondaryNavigationItems = [
  {
    label: 'Keluar',
    action: 'logout',
    icon: LogOut01,
    variant: 'danger',
  },
]
