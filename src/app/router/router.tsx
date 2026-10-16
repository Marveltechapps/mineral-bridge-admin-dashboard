import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout/AuthLayout';
import { RouteError } from '@/app/router/RouteError';

const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const VerifyPage = lazy(() => import('@/modules/auth/pages/VerifyPage'));
const LockedPage = lazy(() => import('@/modules/auth/pages/LockedPage'));
const SignedOutPage = lazy(() => import('@/modules/auth/pages/SignedOutPage'));

const OverviewPage = lazy(() => import('@/modules/overview/pages/OverviewPage'));
const OrdersShell = lazy(() => import('@/modules/orders/pages/OrdersShell'));
const OrderListPage = lazy(() => import('@/modules/orders/pages/OrderListPage'));
const OrderDetailPage = lazy(() => import('@/modules/orders/pages/OrderDetailPage'));
const IntakePage = lazy(() => import('@/modules/orders/pages/IntakePage'));
const VaultListPage = lazy(() => import('@/modules/vault/pages/VaultListPage'));
const LotDetailPage = lazy(() => import('@/modules/vault/pages/LotDetailPage'));
const ListingsPage = lazy(() => import('@/modules/listings/pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('@/modules/listings/pages/ListingDetailPage'));
const PricingShell = lazy(() => import('@/modules/pricing/pages/PricingShell'));
const RatesPage = lazy(() => import('@/modules/pricing/pages/RatesPage'));
const OffersPage = lazy(() => import('@/modules/pricing/pages/OffersPage'));
const AuctionsShell = lazy(() => import('@/modules/auctions/pages/AuctionsShell'));
const LiveAuctionsPage = lazy(() => import('@/modules/auctions/pages/AuctionListsPage').then((m) => ({ default: m.LiveAuctionsPage })));
const UpcomingAuctionsPage = lazy(() => import('@/modules/auctions/pages/AuctionListsPage').then((m) => ({ default: m.UpcomingAuctionsPage })));
const EndedAuctionsPage = lazy(() => import('@/modules/auctions/pages/AuctionListsPage').then((m) => ({ default: m.EndedAuctionsPage })));
const AuctionCreatePage = lazy(() => import('@/modules/auctions/pages/AuctionCreatePage'));
const AuctionMonitorPage = lazy(() => import('@/modules/auctions/pages/AuctionMonitorPage'));
const AuctionResolutionPage = lazy(() => import('@/modules/auctions/pages/AuctionResolutionPage'));
const LcPage = lazy(() => import('@/modules/lc/pages/LcPage'));
const CollabPage = lazy(() => import('@/modules/collab/pages/CollabPage'));
const ChainPage = lazy(() => import('@/modules/chain/pages/ChainPage'));
const UsersShell = lazy(() => import('@/modules/users/pages/UsersShell'));
const UserListPage = lazy(() => import('@/modules/users/pages/UserListPage'));
const TierRequestsPage = lazy(() => import('@/modules/users/pages/TierRequestsPage'));
const UserDetailPage = lazy(() => import('@/modules/users/pages/UserDetailPage'));
const VerificationShell = lazy(() => import('@/modules/verification/pages/VerificationShell'));
const KycQueuePage = lazy(() => import('@/modules/verification/pages/KycQueuePage'));
const ExpiryPage = lazy(() => import('@/modules/verification/pages/ExpiryPage'));
const DisputesPage = lazy(() => import('@/modules/disputes/pages/DisputesPage'));
const DisputeDetailPage = lazy(() => import('@/modules/disputes/pages/DisputeDetailPage'));
const AcademyShell = lazy(() => import('@/modules/academy/pages/AcademyShell'));
const CoursesPage = lazy(() => import('@/modules/academy/pages/CoursesPage'));
const CompletionPage = lazy(() => import('@/modules/academy/pages/CompletionPage'));
const MarketingPage = lazy(() => import('@/modules/marketing/pages/MarketingPage'));
const PartnersPage = lazy(() => import('@/modules/partners/pages/PartnersPage'));
const SupportShell = lazy(() => import('@/modules/support/pages/SupportPages').then((m) => ({ default: m.SupportShell })));
const TicketsPage = lazy(() => import('@/modules/support/pages/SupportPages').then((m) => ({ default: m.TicketsPage })));
const CallsPage = lazy(() => import('@/modules/support/pages/SupportPages').then((m) => ({ default: m.CallsPage })));
const AuditPage = lazy(() => import('@/modules/audit/pages/AuditPage'));
const FinancialPage = lazy(() => import('@/modules/financial/pages/FinancialPage'));
const AnalyticsPage = lazy(() => import('@/modules/analytics/pages/AnalyticsPage'));
const SettingsShell = lazy(() => import('@/modules/settings/pages/SettingsPages').then((m) => ({ default: m.SettingsShell })));
const RolesPage = lazy(() => import('@/modules/settings/pages/SettingsPages').then((m) => ({ default: m.RolesPage })));
const PlatformPage = lazy(() => import('@/modules/settings/pages/SettingsPages').then((m) => ({ default: m.PlatformPage })));
const BitcoinPage = lazy(() => import('@/modules/settings/pages/SettingsPages').then((m) => ({ default: m.BitcoinPage })));
const ProfilePage = lazy(() => import('@/modules/profile/pages/ProfilePage'));

export const routes: RouteObject[] = [
  { element: <AuthLayout stage="login" />, errorElement: <RouteError />, children: [{ path: ROUTES.login, element: <LoginPage /> }] },
  { element: <AuthLayout stage="otp" />, errorElement: <RouteError />, children: [{ path: ROUTES.verify, element: <VerifyPage /> }] },
  { element: <AuthLayout stage="locked" />, errorElement: <RouteError />, children: [{ path: ROUTES.locked, element: <LockedPage /> }] },
  { element: <AuthLayout stage="out" />, errorElement: <RouteError />, children: [{ path: ROUTES.signedOut, element: <SignedOutPage /> }] },
  {
    element: <AdminLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to={ROUTES.overview} replace /> },
      { path: ROUTES.overview, element: <OverviewPage /> },
      {
        path: ROUTES.orders,
        element: <OrdersShell />,
        children: [
          { index: true, element: <OrderListPage /> },
          { path: 'intake', element: <IntakePage /> },
          { path: ':orderId', element: <OrderDetailPage /> },
        ],
      },
      { path: ROUTES.vault, element: <VaultListPage /> },
      { path: '/vault/:lotId', element: <LotDetailPage /> },
      { path: ROUTES.listings, element: <ListingsPage /> },
      { path: '/listings/:listingId', element: <ListingDetailPage /> },
      {
        path: ROUTES.pricing,
        element: <PricingShell />,
        children: [
          { index: true, element: <RatesPage /> },
          { path: 'offers', element: <OffersPage /> },
        ],
      },
      {
        path: ROUTES.auctions,
        element: <AuctionsShell />,
        children: [
          { index: true, element: <LiveAuctionsPage /> },
          { path: 'upcoming', element: <UpcomingAuctionsPage /> },
          { path: 'ended', element: <EndedAuctionsPage /> },
          { path: 'create', element: <AuctionCreatePage /> },
          { path: 'live/:auctionId', element: <AuctionMonitorPage /> },
          { path: 'ended/:auctionId', element: <AuctionResolutionPage /> },
        ],
      },
      { path: ROUTES.lc, element: <LcPage /> },
      { path: ROUTES.collab, element: <CollabPage /> },
      { path: ROUTES.chain, element: <ChainPage /> },
      {
        path: ROUTES.users,
        element: <UsersShell />,
        children: [
          { index: true, element: <UserListPage /> },
          { path: 'tiers', element: <TierRequestsPage /> },
          { path: ':userId', element: <UserDetailPage /> },
        ],
      },
      {
        path: ROUTES.verification,
        element: <VerificationShell />,
        children: [
          { index: true, element: <KycQueuePage /> },
          { path: 'expiry', element: <ExpiryPage /> },
        ],
      },
      { path: ROUTES.disputes, element: <DisputesPage /> },
      { path: '/disputes/:disputeId', element: <DisputeDetailPage /> },
      {
        path: ROUTES.academy,
        element: <AcademyShell />,
        children: [
          { index: true, element: <CoursesPage /> },
          { path: 'analytics', element: <CompletionPage /> },
        ],
      },
      { path: ROUTES.marketing, element: <MarketingPage /> },
      { path: ROUTES.partners, element: <PartnersPage /> },
      {
        path: ROUTES.support,
        element: <SupportShell />,
        children: [
          { index: true, element: <TicketsPage /> },
          { path: 'calls', element: <CallsPage /> },
        ],
      },
      { path: ROUTES.audit, element: <AuditPage /> },
      { path: ROUTES.financial, element: <FinancialPage /> },
      { path: ROUTES.analytics, element: <AnalyticsPage /> },
      {
        path: ROUTES.settings,
        element: <SettingsShell />,
        children: [
          { index: true, element: <RolesPage /> },
          { path: 'platform', element: <PlatformPage /> },
          { path: 'btc', element: <BitcoinPage /> },
        ],
      },
      { path: ROUTES.profile, element: <ProfilePage /> },
      { path: '*', element: <Navigate to={ROUTES.overview} replace /> },
    ],
  },
];

/** Opts into the React Router v7 behaviours ahead of the upgrade (silences the deprecation warnings). */
export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;

export const router = createBrowserRouter(routes, { future: routerFuture });
