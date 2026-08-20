export type OnboardingStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
};

export type AuthStackParamList = {
  AuthLanding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  StoreDetails: { storeId: string };
  ProductDetails: { productId: string; storeId?: string };
  AllProducts: { storeId: string; storeName: string };
  AllStores: { title: string };
  Cart: undefined;
  OrderDetails: { orderId: string };
  Payment: { orderId: string; paymentUrl: string; reference: string };
  EditProfile: undefined;
  SavedAddresses: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Orders: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type StoreStackParamList = {
  StoreTabs: undefined;
  Products: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  ManageCategories: { storeId: string };
  StoreOrders: undefined;
  CreateStore: undefined;
  EditProfile: undefined;
  StoreSettings: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
  StoreWallet: undefined;
  StoreAnalytics: undefined;
  BankAccount: undefined;
};

export type RiderStackParamList = {
  RiderTabs: undefined;
  DeliveryDetails: { orderId: string };
  EditProfile: undefined;
  Earnings: undefined;
  VehicleInfo: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
  BankAccount: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: undefined;
  Store: undefined;
  Rider: undefined;
};
