import '../../../css/tibbak.css';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { initSmoothScroll, animateHero, animateSectionsOnScroll, animatePDP, animateCollectionSidebar, killAllAnimations } from '@/lib/animations';

interface ProductVariant { value: string; price: string; image: string | null }

interface Product {
    id: number;
    name: string;
    slug: string;
    price: string;
    sale_price: string | null;
    category: string | null;
    stock_status: string;
    featured_image: string | null;
    excerpt: string | null;
    description: string | null;
    variants: ProductVariant[] | null;
    allows_engraving: boolean;
}

interface CartItem { id: number; qty: number; variant: string | null }

// ---- BILINGUAL COPY ----
const COPY = {
    en: {
        dir: 'ltr' as const,
        meta_left: 'Ships across Jordan · Cash on delivery available',
        meta_mid: 'Amman · Irbid · Zarqa · Aqaba',
        meta_right: '48 h delivery across Jordan',
        nav: { home: 'Home', shop: 'Shop', how: 'How it works' },
        util: { search: 'Search', cart: 'Cart' },
        hero: {
            pill: 'Built for Jordan\'s medical students',
            title_a: 'Everything for your ',
            title_em: 'clinical year',
            title_b: ', delivered.',
            lede: 'Stethoscopes, BP cuffs, otoscopes, scrubs, and pocket references — picked by senior residents, priced for students, shipped anywhere in Jordan.',
            cta_primary: 'Browse all products',
            cta_ghost: 'How it works',
            trust: [
                { i: 'shield', t: '2-year warranty on instruments' },
                { i: 'truck',  t: '48-hour delivery across Jordan' },
                { i: 'wallet', t: 'Cash on delivery — all Jordan' },
            ],
        },
        sections: {
            cats:     { eye: 'Shop by category', title: 'Find what you need, fast.' },
            featured: { eye: 'Top picks', title: 'Most-bought for clinical rotations' },
            how:      { eye: 'How it works',  title: 'Order, receive, start your rotation.' },
            unis:     'Trusted by students at',
        },
        cats_cta: 'Browse all categories',
        feats_cta: 'View all products',
        steps: [
            { n: '01', t: 'Build your kit',           b: 'Pick exactly what you need for your clinical year — individual instruments, coats, or pocket references.' },
            { n: '02', t: 'Check out — pay your way', b: 'Cash on delivery anywhere in Jordan, or pay by card at your door. Show a student ID for a 10% discount.' },
            { n: '03', t: 'Receive in 48 hours',      b: 'We ship to all 12 governorates within 48 hours. Stethoscopes ship with free name engraving.' },
        ],
        features: [
            { i: 'engrave', t: 'Free engraving',   b: 'Add your name on any stethoscope at checkout.' },
            { i: 'truck',   t: '48-hour delivery',  b: 'All 12 governorates, including Aqaba and Mafraq.' },
            { i: 'wallet',  t: 'Cash on delivery',  b: 'Pay when you receive — across all Jordan.' },
            { i: 'shield',  t: '2-year warranty',   b: 'On all instruments purchased from Tibbuk.' },
        ],
        pdp: {
            crumbs: 'Shop',
            qty: 'Quantity',
            addCart: 'Add to cart',
            assurances: [
                { i: 'truck',  k: 'Ships in 48 h',    v: 'Across Jordan' },
                { i: 'wallet', k: 'Cash on delivery', v: 'Available everywhere' },
                { i: 'shield', k: '2-year warranty',  v: 'On all instruments' },
                { i: 'return', k: '30-day returns',   v: 'Unopened items only' },
            ],
            specsTitle: 'Specifications',
            relatedTitle: 'Goes well with',
        },
        cart: {
            title: 'Your cart',
            empty: 'Your cart is empty',
            emptyBody: 'Add a stethoscope, BP cuff, or browse by category to get started.',
            browse: 'Continue shopping',
            sub: 'Subtotal',
            ship: 'Shipping',
            shipFree: 'Free',
            tax: 'Tax (16% VAT)',
            total: 'Total',
            checkout: 'Continue to checkout',
            remove: 'Remove',
            currency: 'JD',
        },
        col: {
            eye: 'Shop',
            title: 'All medical equipment',
            lede: 'Over 200 products picked for med students in Jordan — from stethoscopes to scrubs to pocket references.',
            count: 'products',
            sort: 'Sort:',
            sortOpts: 'Most popular',
        },
        bundlesPage: {
            eye: 'Student bundles',
            title: 'One purchase. Everything for your year.',
            lede: 'Curated by senior residents from Jordan\'s medical schools. Save up to 25% versus buying piece-by-piece.',
        },
        universities: [
            { name: 'University of Jordan',                         short: 'JU'        },
            { name: 'Jordan University of Science and Technology',   short: 'JUST'      },
            { name: 'Hashemite University',                         short: 'Hashemite' },
            { name: 'Mu\'tah University',                           short: 'Mu\'tah'   },
            { name: 'Yarmouk University',                           short: 'Yarmouk'   },
        ],
        footer: {
            tag: 'Independent supplier of medical equipment, built for Jordan\'s medical students. Based in Amman.',
            sections: [
                { h: 'Shop',    links: ['Stethoscopes', 'Diagnostics', 'Coats & Scrubs', 'Practice kits', 'Pocket references'] },
                { h: 'Support', links: ['Contact us', 'Track your order', 'Shipping & returns', 'Student discount'] },
            ],
            news: 'Get clinical-year tips',
            newsBody: 'Once a month, a short email from our team — kit checklists, OSCE prep, and a discount or two.',
            newsPlaceholder: 'Your email',
            newsCta: 'Subscribe',
            legal_l: '© 2026 Tibbuk. Registered in Amman, Jordan.',
            legal_r: 'Terms · Privacy · Refund policy',
            pay: ['Visa', 'Mastercard', 'Click', 'eFAWATEERcom', 'COD'],
        },
        addedToast: 'Added to cart',
        checkout: {
            title: 'Checkout',
            name: 'Full Name *',
            phone: 'Phone Number *',
            email: 'Email Address',
            facebook: 'Facebook Profile URL',
            address: 'Delivery Address *',
            notes: 'Order Notes',
            namePlaceholder: 'Your full name',
            phonePlaceholder: '07XXXXXXXX or +96279XXXXXXX',
            emailPlaceholder: 'Optional',
            facebookPlaceholder: 'facebook.com/your.name — optional',
            addressPlaceholder: 'Full delivery address in Jordan',
            notesPlaceholder: 'Any special requests…',
            summary: 'Order Summary',
            submit: 'Place Order',
            submitting: 'Placing Order…',
            engravingLabel: 'Name on product',
            engravingPlaceholder: 'e.g. Dr. Ahmad — up to 30 characters',
        },
    },
    ar: {
        dir: 'rtl' as const,
        meta_left: 'نشحن في كلّ أنحاء الأردن · الدفع عند الاستلام متاح',
        meta_mid: 'عمّان · إربد · الزرقاء · العقبة',
        meta_right: 'توصيل خلال ٤٨ ساعة في كلّ الأردنّ',
        nav: { home: 'الرئيسية', shop: 'المتجر', how: 'كيف يعمل' },
        util: { search: 'بحث', cart: 'السلّة' },
        hero: {
            pill: 'مصمَّم لطلبة الطبّ في الأردنّ',
            title_a: 'كلّ ما يلزمك ',
            title_em: 'للسنة السريريّة',
            title_b: '، يصلك إلى باب بيتك.',
            lede: 'سمّاعات وأجهزة ضغط ومناظير أذن وسكرَب ومراجع جيب — يختارها أطبّاء مقيمون، بأسعار للطلّاب، تُشحن إلى أيّ مكان في الأردنّ.',
            cta_primary: 'تصفّح كلّ المنتجات',
            cta_ghost: 'كيف يعمل',
            trust: [
                { i: 'shield', t: 'ضمان سنتين على الأدوات' },
                { i: 'truck',  t: 'توصيل خلال ٤٨ ساعة في كلّ الأردنّ' },
                { i: 'wallet', t: 'الدفع عند الاستلام — كلّ الأردنّ' },
            ],
        },
        sections: {
            cats:     { eye: 'تسوّق حسب الفئة', title: 'اعثر على ما تحتاجه بسرعة.' },
            featured: { eye: 'الأكثر شراءً', title: 'الأكثر طلباً للجولات السريريّة' },
            how:      { eye: 'كيف يعمل', title: 'اطلب، استلم، ابدأ جولتك.' },
            unis:     'يثق بنا طلّاب',
        },
        cats_cta: 'تصفّح كلّ الفئات',
        feats_cta: 'اعرض كلّ المنتجات',
        steps: [
            { n: '٠١', t: 'جهّز عُدّتك',          b: 'اختر بالضبط ما تحتاجه للسنة السريريّة — أدوات، معاطف، أو مراجع جيب.' },
            { n: '٠٢', t: 'ادفع كما يناسبك',       b: 'الدفع عند الاستلام في كلّ الأردنّ، أو بالبطاقة. أحضر بطاقة الجامعة لخصم ١٠٪.' },
            { n: '٠٣', t: 'استلم خلال ٤٨ ساعة',   b: 'نشحن إلى كلّ المحافظات الـ١٢ خلال ٤٨ ساعة. السمّاعات تُشحن بنقش اسم مجّاني.' },
        ],
        features: [
            { i: 'engrave', t: 'نقش مجّاني',           b: 'أضف اسمك على أيّ سمّاعة عند الدفع.' },
            { i: 'truck',   t: 'توصيل خلال ٤٨ ساعة',  b: 'إلى كلّ المحافظات بما فيها العقبة والمفرق.' },
            { i: 'wallet',  t: 'الدفع عند الاستلام',  b: 'ادفع عند الاستلام في كلّ الأردنّ.' },
            { i: 'shield',  t: 'ضمان سنتين',          b: 'على كلّ الأدوات المشتراة من طِبّك.' },
        ],
        pdp: {
            crumbs: 'المتجر',
            qty: 'الكمّية',
            addCart: 'أضف إلى السلّة',
            assurances: [
                { i: 'truck',  k: 'شحن خلال ٤٨ ساعة',   v: 'في كلّ الأردنّ' },
                { i: 'wallet', k: 'الدفع عند الاستلام',  v: 'متاح في كلّ مكان' },
                { i: 'shield', k: 'ضمان سنتين',          v: 'على كلّ الأدوات' },
                { i: 'return', k: 'إرجاع خلال ٣٠ يوماً', v: 'للمنتجات غير المفتوحة' },
            ],
            specsTitle: 'المواصفات',
            relatedTitle: 'قد يعجبك أيضاً',
        },
        cart: {
            title: 'سلّتك',
            empty: 'سلّتك فارغة',
            emptyBody: 'أضف سمّاعة أو جهاز ضغط أو تصفّح حسب الفئة لتبدأ.',
            browse: 'تابع التسوّق',
            sub: 'المجموع الفرعي',
            ship: 'الشحن',
            shipFree: 'مجّاني',
            tax: 'الضريبة (١٦٪)',
            total: 'الإجمالي',
            checkout: 'متابعة إلى الدفع',
            remove: 'إزالة',
            currency: 'د.أ',
        },
        col: {
            eye: 'المتجر',
            title: 'كلّ المعدّات الطبيّة',
            lede: 'أكثر من ٢٠٠ منتج اختيرت لطلبة الطبّ في الأردنّ — من السمّاعات إلى السكرَب إلى مراجع الجيب.',
            count: 'منتجاً',
            sort: 'الترتيب:',
            sortOpts: 'الأكثر شعبيّة',
        },
        bundlesPage: {
            eye: 'حزم الطلّاب',
            title: 'عمليّة شراء واحدة. كلّ ما تحتاجه لسنتك.',
            lede: 'أعدّها أطبّاء مقيمون من كلّيّات الطبّ الأردنيّة. وفّر حتّى ٢٥٪ مقارنةً بالشراء الفردي.',
        },
        universities: [
            { name: 'الجامعة الأردنيّة',                      short: 'الأردنيّة' },
            { name: 'جامعة العلوم والتكنولوجيا الأردنيّة',    short: 'JUST'      },
            { name: 'الجامعة الهاشميّة',                      short: 'الهاشميّة'  },
            { name: 'جامعة مؤتة',                             short: 'مؤتة'      },
            { name: 'جامعة اليرموك',                          short: 'اليرموك'   },
        ],
        footer: {
            tag: 'مورِّد مستقلّ للمعدّات الطبيّة، مصمّم لطلبة الطبّ في الأردنّ. مقرّنا عمّان.',
            sections: [
                { h: 'المتجر',    links: ['السمّاعات', 'أدوات التشخيص', 'المعاطف والسكرَب', 'أطقم التدريب', 'مراجع الجيب'] },
                { h: 'المساعدة',  links: ['تواصل معنا', 'تتبّع طلبك', 'الشحن والإرجاع', 'خصم الطلّاب'] },
            ],
            news: 'نصائح للسنة السريريّة',
            newsBody: 'مرّة في الشهر، رسالة قصيرة من فريقنا — قوائم العُدّة وتحضير OSCE وخصم أو اثنين.',
            newsPlaceholder: 'بريدك الإلكتروني',
            newsCta: 'اشترك',
            legal_l: '© ٢٠٢٦ طِبّك (Tibbuk). مسجَّلة في عمّان، الأردنّ.',
            legal_r: 'الشروط · الخصوصيّة · سياسة الإرجاع',
            pay: ['Visa', 'Mastercard', 'Click', 'eFAWATEERcom', 'الدفع عند الاستلام'],
        },
        addedToast: 'أُضيف إلى السلّة',
        checkout: {
            title: 'الدفع',
            name: 'الاسم الكامل *',
            phone: 'رقم الهاتف *',
            email: 'البريد الإلكتروني',
            facebook: 'رابط حساب فيسبوك',
            address: 'عنوان التوصيل *',
            notes: 'ملاحظات الطلب',
            namePlaceholder: 'اسمك الكامل',
            phonePlaceholder: '07XXXXXXXX',
            emailPlaceholder: 'اختياري',
            facebookPlaceholder: 'facebook.com/your.name — اختياري',
            addressPlaceholder: 'عنوان التوصيل الكامل في الأردنّ',
            notesPlaceholder: 'أيّ طلبات خاصّة…',
            summary: 'ملخّص الطلب',
            engravingLabel: 'الاسم على المنتج',
            engravingPlaceholder: 'مثال: د. أحمد — حتى ٣٠ حرفاً',
            submit: 'أكمل الطلب',
            submitting: 'جارٍ الطلب…',
        },
    },
} as const;

type Lang = keyof typeof COPY;

const BUNDLE = {
    badge: { en: 'Year 4 Clinical Kit', ar: 'حزمة السنة الرابعة السريريّة' },
    title: {
        en: 'Everything you need for your first day on the wards.',
        ar: 'كلّ ما تحتاجه ليومك الأوّل في الأقسام السريريّة.',
    },
    lede: {
        en: 'Save 22% versus buying individually. Hand-picked by senior residents from JU and JUST.',
        ar: 'وفّر ٢٢٪ مقارنةً بالشراء الفردي. اختارها أطبّاء مقيمون من الجامعة الأردنيّة وجامعة العلوم والتكنولوجيا.',
    },
    price: 198,
    priceOld: 254,
    save: 56,
    items: [
        { en: 'Cardiology III Stethoscope', ar: 'سمّاعة كارديولوجي ٣' },
        { en: 'Aneroid BP Cuff',            ar: 'جهاز ضغط يدوي' },
        { en: 'Fiber-optic Otoscope',       ar: 'منظار أذن بألياف ضوئية' },
        { en: 'Taylor Reflex Hammer',       ar: 'مطرقة تايلور' },
        { en: 'Medical Penlight',           ar: 'قلم إضاءة طبّي' },
        { en: 'Pocket Clinical Handbook',   ar: 'كتيّب جيب سريري' },
    ],
};

// Icon hints for known category names — add more as needed
const CAT_ICON_MAP: Record<string, string> = {
    stethoscope: 'steth', stethoscopes: 'steth', سمّاعات: 'steth',
    diagnostic: 'diag', diagnostics: 'diag', تشخيص: 'diag',
    apparel: 'coat', coat: 'coat', scrub: 'coat', coats: 'coat', سكرَب: 'coat', معاطف: 'coat',
    kit: 'kit', kits: 'kit', أطقم: 'kit',
};

// ---- ICONS ----
function ArrowIcon() {
    return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
}
function BagIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1 13H6L5 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>;
}
function SearchIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
}
function CloseIcon() {
    return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>;
}
function CheckIcon() {
    return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 9.5 18 20 6.5"/></svg>;
}
function ShieldIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function TruckIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h11v10H2zM13 10h5l3 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
}
function WalletIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.4" fill="currentColor"/></svg>;
}
function EngraveIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="m6 17 11-11 3 3L9 20l-4 1 1-4Z"/></svg>;
}
function ReturnIcon() {
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 3v5h5"/></svg>;
}
function StethIcon() {
    return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v6a4 4 0 0 0 8 0V4"/><path d="M10 14v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="13" r="2"/><circle cx="6" cy="4" r="1"/><circle cx="14" cy="4" r="1"/></svg>;
}
function DiagIcon() {
    return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/><path d="M12 12v4M10 14h4"/></svg>;
}
function CoatIcon() {
    return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7v14h16V7l-4-4M8 3l4 5 4-5M10 13h4M10 17h4"/></svg>;
}
function KitIcon() {
    return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M12 11v6M9 14h6"/></svg>;
}
function EmptyCartIcon() {
    return <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1 13H6L5 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M9 12h6"/></svg>;
}
function IgIcon() {
    return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>;
}
function WaIcon() {
    return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.7 3.1 1.1 4.8 1.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm5.6 14.4c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.4-5.2-4.6-.1-.2-1.2-1.5-1.2-2.9 0-1.4.7-2.1 1-2.4.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.6 0 .2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.7.8 2 .9.3.2.5.3.6.4.1.2.1.7-.1 1.4z"/></svg>;
}

function FeatureIcon({ kind }: { kind: string }) {
    switch (kind) {
        case 'engrave': return <EngraveIcon />;
        case 'truck':   return <TruckIcon />;
        case 'wallet':  return <WalletIcon />;
        case 'shield':  return <ShieldIcon />;
        case 'return':  return <ReturnIcon />;
        default: return <ShieldIcon />;
    }
}

function CatIconComp({ kind }: { kind: string }) {
    switch (kind) {
        case 'steth': return <StethIcon />;
        case 'coat':  return <CoatIcon />;
        case 'kit':   return <KitIcon />;
        default: return <DiagIcon />;
    }
}

// ---- PLACEHOLDER ----
function PHolder({ accent = 'default', label }: { accent?: string; label?: string }) {
    const cls = 'placeholder' + (accent === 'green' ? ' placeholder--green' : accent === 'terra' ? ' placeholder--terra' : '');
    return (
        <div className={cls}>
            {label && <span className="placeholder__label">{label}</span>}
        </div>
    );
}

function fmt(amount: string | number, currency: string) {
    return `${currency} ${Number(amount).toFixed(2)}`;
}

// ---- META STRIP ----
function MetaStrip({ t }: { t: typeof COPY.en }) {
    return (
        <div className="meta-strip">
            <div className="meta-strip__inner">
                <div><span className="meta-strip__dot" />{t.meta_left}</div>
                <div>{t.meta_mid}</div>
                <div>{t.meta_right}</div>
            </div>
        </div>
    );
}

// ---- HEADER ----
function SunIcon() {
    return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>;
}
function MoonIcon() {
    return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>;
}

function Header({ lang, setLang, dark, setDark, route, navigate, cartCount, openCart, openSearch }: {
    lang: Lang;
    setLang: (l: Lang) => void;
    dark: boolean;
    setDark: (d: boolean) => void;
    route: string;
    navigate: (r: string, pid?: number | null, cat?: string | null) => void;
    cartCount: number;
    openCart: () => void;
    openSearch: () => void;
}) {
    const t = COPY[lang];
    return (
        <header className="site-header">
            <div className="wrap site-header__bar">
                <button className="brand" onClick={() => navigate('home')} aria-label="Tibbuk — home">
                    <span className="brand__word">Tibbuk</span>
                    <span className="brand__dot" />
                    <span className="brand__ar">طِبّك</span>
                </button>
                <nav className="site-header__nav" aria-label="Primary">
                    <a className={route === 'home' ? 'active' : ''} onClick={() => navigate('home')}>{t.nav.home}</a>
                    <a className={route === 'collection' ? 'active' : ''} onClick={() => navigate('collection')}>{t.nav.shop}</a>
                    <a className={route === 'how' ? 'active' : ''} onClick={() => navigate('how')}>{t.nav.how}</a>
                </nav>
                <div className="site-header__util">
                    <div className="lang-toggle" role="group" aria-label="Language">
                        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
                        <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')} aria-pressed={lang === 'ar'}>ع</button>
                    </div>
                    <button className="icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)}>
                        {dark ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button className="icon-btn" aria-label={t.util.search} onClick={openSearch}><SearchIcon /></button>
                    <button className="icon-btn" aria-label={`${t.util.cart} (${cartCount})`} onClick={openCart}>
                        <BagIcon />
                        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                    </button>
                </div>
            </div>
        </header>
    );
}

// ---- PRODUCT CARD ----
function ProductCard({ product, lang, onAdd, onNavigate }: {
    product: Product;
    lang: Lang;
    onAdd: (p: Product) => void;
    onNavigate: (p: Product) => void;
}) {
    const t = COPY[lang];
    const price = Number(product.price);
    const salePrice = product.sale_price ? Number(product.sale_price) : null;
    const inStock = product.stock_status === 'in_stock';
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const quickLabel = hasVariants
        ? (lang === 'en' ? 'View options' : 'عرض الخيارات')
        : (lang === 'en' ? 'Add to cart' : 'أضف إلى السلّة');
    const oosLabel = lang === 'en' ? 'Out of stock' : 'نفذت الكمّية';

    function handleMediaClick() {
        if (!inStock) return;
        if (hasVariants) onNavigate(product);
        else onAdd(product);
    }

    return (
        <div className="pcard" role="article">
            <div className="pcard__media" onClick={handleMediaClick} style={{ cursor: inStock ? 'pointer' : 'default' }}>
                {product.featured_image ? (
                    <img src={product.featured_image} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <PHolder accent="default" label={product.category ?? 'product'} />
                )}
                {!inStock && <span className="pcard__badge">{oosLabel}</span>}
                {inStock && <div className="pcard__quick">{quickLabel}</div>}
            </div>
            <div className="pcard__meta">
                {product.category && <div className="pcard__cat">{product.category}</div>}
                <button
                    className="pcard__name"
                    onClick={() => onNavigate(product)}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'inherit', cursor: 'pointer', width: '100%' }}
                >
                    {product.name}
                </button>
                <div className="pcard__bottom">
                    <span className="pcard__price">
                        {salePrice && salePrice < price ? (
                            <>
                                <span className="num">{fmt(salePrice, t.cart.currency)}</span>
                                <span className="num" style={{ color: 'var(--ink-mute)', textDecoration: 'line-through', fontWeight: 400, marginInlineStart: 8, fontSize: 13 }}>{fmt(price, t.cart.currency)}</span>
                            </>
                        ) : (
                            <span className="num">{fmt(price, t.cart.currency)}</span>
                        )}
                    </span>
                    {!inStock && <span className="pcard__oos">{oosLabel}</span>}
                </div>
            </div>
        </div>
    );
}

// ---- SEARCH OVERLAY ----
function SearchOverlay({ lang, products, onClose, navigate, addToCart }: {
    lang: Lang;
    products: Product[];
    onClose: () => void;
    navigate: (r: string, pid?: number | null, cat?: string | null) => void;
    addToCart: (id: number, variant?: string | null) => void;
}) {
    const t = COPY[lang];
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.category ?? '').toLowerCase().includes(q) ||
            (p.excerpt ?? '').toLowerCase().includes(q)
        ).slice(0, 12);
    }, [query, products]);

    const cur = t.cart.currency;
    const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 8) as string[];

    function pickProduct(p: Product) {
        onClose();
        navigate('product', p.id);
    }

    return (
        <div className="search-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="search-box">
                <SearchIcon />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={lang === 'en' ? 'Search products, categories…' : 'ابحث عن منتجات أو فئات…'}
                    aria-label={t.util.search}
                />
                <button onClick={onClose} aria-label="Close search">
                    <CloseIcon />
                </button>
            </div>
            <div className="search-results">
                {query.trim() === '' && (
                    <div className="search-hint">
                        <div className="search-hint-title">{lang === 'en' ? 'Browse by category' : 'تصفّح حسب الفئة'}</div>
                        <div className="search-hint-cats">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    className="pill pill--ghost"
                                    onClick={() => { onClose(); navigate('collection', null, cat); }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {query.trim() !== '' && results.length === 0 && (
                    <div className="search-empty">
                        {lang === 'en' ? `No results for "${query}"` : `لا نتائج لـ "${query}"`}
                    </div>
                )}
                {results.map(p => {
                    const price = p.sale_price && Number(p.sale_price) < Number(p.price) ? p.sale_price : p.price;
                    return (
                        <button key={p.id} className="search-result" onClick={() => pickProduct(p)}>
                            <div className="search-result__thumb">
                                {p.featured_image
                                    ? <img src={p.featured_image} alt={p.name} />
                                    : <PHolder accent="default" />
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="search-result__name">{p.name}</div>
                                {p.category && <div className="search-result__cat">{p.category}</div>}
                            </div>
                            <div className="search-result__price">{fmt(price, cur)}</div>
                        </button>
                    );
                })}
                {results.length > 0 && (
                    <div style={{ padding: '12px var(--gutter)' }}>
                        <button
                            className="link-btn"
                            onClick={() => { onClose(); navigate('collection'); }}
                        >
                            {lang === 'en' ? `Browse all ${products.length} products` : `تصفّح جميع المنتجات (${products.length})`}
                            <ArrowIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- FOOTER ----
function Footer({ lang, navigate }: { lang: Lang; navigate: (r: string) => void }) {
    const f = COPY[lang].footer;
    return (
        <footer className="site-footer">
            <div className="wrap">
                <div className="site-footer__grid">
                    <div>
                        <button className="site-footer__brand" onClick={() => navigate('home')}>
                            <span className="brand__word">Tibbuk</span>
                            <span className="brand__dot" />
                            <span className="brand__ar">طِبّك</span>
                        </button>
                        <p className="site-footer__sub">{f.tag}</p>
                        <div className="site-footer__socials">
                            <a href="#" aria-label="Instagram"><IgIcon /></a>
                            <a href="#" aria-label="WhatsApp"><WaIcon /></a>
                        </div>
                    </div>
                    {f.sections.map((s, i) => (
                        <div key={i}>
                            <h4>{s.h}</h4>
                            <ul>{s.links.map((l, j) => <li key={j}><a href="#">{l}</a></li>)}</ul>
                        </div>
                    ))}
                    <div>
                        <h4>{f.news}</h4>
                        <p className="site-footer__sub" style={{ marginBottom: 14 }}>{f.newsBody}</p>
                        <form className="newsletter" onSubmit={e => e.preventDefault()}>
                            <input type="email" placeholder={f.newsPlaceholder} aria-label={f.newsPlaceholder} />
                            <button type="submit">{f.newsCta}</button>
                        </form>
                    </div>
                </div>
                <div className="site-footer__bottom">
                    <div>{f.legal_l} · {f.legal_r}</div>
                    <div>
                        <span style={{ fontSize: 12, color: 'var(--ink-mute)', marginInlineEnd: 16 }}>
                            <a href="/admin" style={{ color: 'inherit' }}>{lang === 'en' ? 'Admin' : 'الإدارة'}</a>
                        </span>
                        <span className="site-footer__pay" style={{ display: 'inline-flex' }}>
                            {f.pay.map((p, i) => <span key={i}>{p}</span>)}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ---- CART DRAWER ----
function CartDrawer({ open, onClose, lang, cart, setCart, products, navigate, onCheckout }: {
    open: boolean;
    onClose: () => void;
    lang: Lang;
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    products: Product[];
    navigate: (r: string) => void;
    onCheckout: () => void;
}) {
    const t = COPY[lang].cart;

    const items = useMemo(() =>
        cart.map(line => {
            const product = products.find(p => p.id === line.id);
            return product ? { ...line, product } : null;
        }).filter(Boolean) as (CartItem & { product: Product })[],
        [cart, products]
    );

    function linePrice(l: CartItem & { product: Product }): number {
        if (l.variant) {
            const vp = l.product.variants?.find(v => v.value === l.variant)?.price;
            if (vp) return Number(vp);
        }
        return Number(l.product.sale_price ?? l.product.price);
    }

    const subtotal = items.reduce((s, l) => s + linePrice(l) * l.qty, 0);
    const ship = 3;
    const totalCount = items.reduce((s, l) => s + l.qty, 0);

    function setQty(id: number, variant: string | null, qty: number) {
        if (qty <= 0) {
            setCart(c => c.filter(l => !(l.id === id && l.variant === variant)));
        } else {
            setCart(c => c.map(l => l.id === id && l.variant === variant ? { ...l, qty } : l));
        }
    }

    return (
        <>
            <div className={`drawer-backdrop${open ? ' on' : ''}`} onClick={onClose} aria-hidden={!open} />
            <aside className={`drawer${open ? ' on' : ''}`} aria-hidden={!open} role="dialog" aria-label={t.title}>
                <div className="drawer__head">
                    <h2>
                        {t.title}
                        {totalCount > 0 && (
                            <span className="num" style={{ color: 'var(--ink-mute)', fontWeight: 400, fontSize: 14, marginInlineStart: 6 }}>
                                ({totalCount})
                            </span>
                        )}
                    </h2>
                    <button className="drawer__close" onClick={onClose} aria-label="Close cart">
                        <CloseIcon />
                    </button>
                </div>
                <div className="drawer__body">
                    {items.length === 0 ? (
                        <div className="cart-empty">
                            <div className="cart-empty__icon"><EmptyCartIcon /></div>
                            <h3>{t.empty}</h3>
                            <p>{t.emptyBody}</p>
                            <button className="btn" onClick={() => { onClose(); navigate('collection'); }}>
                                {t.browse} <span className="arrow"><ArrowIcon /></span>
                            </button>
                        </div>
                    ) : (
                        items.map(l => {
                            const price = linePrice(l);
                            return (
                                <div className="cart-line" key={`${l.id}-${l.variant}`}>
                                    <div className="cart-line__media">
                                        {(() => {
                                            const variantImg = l.variant
                                                ? l.product.variants?.find(v => v.value === l.variant)?.image
                                                : null;
                                            const src = variantImg ?? l.product.featured_image;
                                            return src
                                                ? <img src={src} alt={l.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <PHolder accent="default" />;
                                        })()}
                                    </div>
                                    <div>
                                        <div className="cart-line__name">{l.product.name}</div>
                                        {l.variant && <div className="cart-line__cat">{l.variant}</div>}
                                        {!l.variant && l.product.category && <div className="cart-line__cat">{l.product.category}</div>}
                                        <div className="cart-line__qty">
                                            <button onClick={() => setQty(l.id, l.variant, l.qty - 1)} aria-label="Decrease">−</button>
                                            <span className="v">{l.qty}</span>
                                            <button onClick={() => setQty(l.id, l.variant, l.qty + 1)} aria-label="Increase">+</button>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'end' }}>
                                        <div className="cart-line__price">
                                            <span className="num">{fmt(Number(price) * l.qty, t.currency)}</span>
                                        </div>
                                        <button className="cart-line__remove" onClick={() => setCart(c => c.filter(x => !(x.id === l.id && x.variant === l.variant)))}>
                                            {t.remove}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {items.length > 0 && (
                    <div className="drawer__foot">
                        <div className="cart-totals">
                            <div className="cart-totals__row">
                                <span>{t.sub}</span>
                                <span className="num">{fmt(subtotal, t.currency)}</span>
                            </div>
                            <div className="cart-totals__row">
                                <span>{t.ship}</span>
                                <span>{ship === 0 ? t.shipFree : <span className="num">{fmt(ship, t.currency)}</span>}</span>
                            </div>
                            <div className="cart-totals__row cart-totals__row--big">
                                <span>{t.total}</span>
                                <span className="num">{fmt(subtotal + ship, t.currency)}</span>
                            </div>
                        </div>
                        <button className="btn btn--full btn--lg" onClick={onCheckout}>
                            {t.checkout} <span className="arrow"><ArrowIcon /></span>
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}

// ---- CHECKOUT MODAL ----
function CheckoutModal({ open, onClose, cart, products, lang }: {
    open: boolean;
    onClose: () => void;
    cart: CartItem[];
    products: Product[];
    lang: Lang;
}) {
    const t = COPY[lang].checkout;
    const cartT = COPY[lang].cart;
    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_facebook: '',
        delivery_address: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [engravingTexts, setEngravingTexts] = useState<Record<string, string>>({});

    const items = cart.map(line => {
        const product = products.find(p => p.id === line.id);
        return product ? { ...line, product } : null;
    }).filter(Boolean) as (CartItem & { product: Product })[];

    function linePrice(l: CartItem & { product: Product }): number {
        if (l.variant) {
            const vp = l.product.variants?.find(v => v.value === l.variant)?.price;
            if (vp) return Number(vp);
        }
        return Number(l.product.sale_price ?? l.product.price);
    }

    const subtotal = items.reduce((s, l) => s + linePrice(l) * l.qty, 0);
    const ship = 3;

    function validatePhone(phone: string) {
        return /^(\+?962|0)7[789]\d{7}$/.test(phone);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!form.customer_name.trim()) errs.customer_name = lang === 'en' ? 'Full name is required.' : 'الاسم مطلوب.';
        if (!form.customer_phone.trim()) {
            errs.customer_phone = lang === 'en' ? 'Phone number is required.' : 'رقم الهاتف مطلوب.';
        } else if (!validatePhone(form.customer_phone)) {
            errs.customer_phone = lang === 'en' ? 'Enter a valid Jordanian phone number (e.g. 07XXXXXXXX).' : 'أدخل رقم هاتف أردني صحيح (مثال: 07XXXXXXXX).';
        }
        if (!form.customer_email.trim()) errs.customer_email = lang === 'en' ? 'Email is required.' : 'البريد الإلكتروني مطلوب.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) errs.customer_email = lang === 'en' ? 'Enter a valid email.' : 'أدخل بريدًا إلكترونيًا صحيحًا.';
        if (!form.customer_facebook.trim()) errs.customer_facebook = lang === 'en' ? 'Facebook / WhatsApp contact is required.' : 'حقل التواصل مطلوب.';
        if (!form.delivery_address.trim()) errs.delivery_address = lang === 'en' ? 'Delivery address is required.' : 'عنوان التوصيل مطلوب.';
        if (cart.length === 0) errs.items = lang === 'en' ? 'Your cart is empty.' : 'سلّتك فارغة.';
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setSubmitting(true);
        router.post('/orders', {
            ...form,
            items: cart.map(i => ({
                product_id: i.id,
                quantity: i.qty,
                variant: i.variant ?? undefined,
                engraving_text: engravingTexts[`${i.id}-${i.variant}`] || undefined,
            })),
        }, {
            onError: (serverErrs) => { setErrors(serverErrs); setSubmitting(false); },
            onSuccess: () => { setForm({ customer_name: '', customer_phone: '', customer_email: '', customer_facebook: '', delivery_address: '', notes: '' }); setEngravingTexts({}); setCart([]); },
        });
    }

    if (!open) return null;

    return (
        <div className="checkout-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="checkout-modal">
                <div className="checkout-modal__head">
                    <h2>{t.title}</h2>
                    <button className="drawer__close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
                </div>
                <div className="checkout-modal__body">
                    <form onSubmit={handleSubmit}>
                        {[
                            { key: 'customer_name',     label: t.name,     placeholder: t.namePlaceholder,     type: 'text' },
                            { key: 'customer_phone',    label: t.phone,    placeholder: t.phonePlaceholder,    type: 'tel' },
                            { key: 'customer_email',    label: t.email,    placeholder: t.emailPlaceholder,    type: 'email' },
                            { key: 'customer_facebook', label: t.facebook, placeholder: t.facebookPlaceholder, type: 'url' },
                        ].map(({ key, label, placeholder, type }) => (
                            <div className="form-field" key={key}>
                                <label>{label}</label>
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    value={form[key as keyof typeof form]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                />
                                {errors[key] && <div className="error">{errors[key]}</div>}
                            </div>
                        ))}
                        <div className="form-field">
                            <label>{t.address}</label>
                            <textarea
                                placeholder={t.addressPlaceholder}
                                rows={3}
                                value={form.delivery_address}
                                onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                            />
                            {errors.delivery_address && <div className="error">{errors.delivery_address}</div>}
                        </div>
                        <div className="form-field">
                            <label>{t.notes}</label>
                            <textarea
                                placeholder={t.notesPlaceholder}
                                rows={2}
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>

                        {items.some(l => l.product.allows_engraving) && (
                            <div className="form-field">
                                {items.filter(l => l.product.allows_engraving).map(l => {
                                    const key = `${l.id}-${l.variant}`;
                                    return (
                                        <div key={key} style={{ marginBottom: '0.75rem' }}>
                                            <label>
                                                {t.engravingLabel}
                                                {' '}
                                                <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.8em' }}>
                                                    — {l.product.name}{l.variant ? ` (${l.variant})` : ''}
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={t.engravingPlaceholder}
                                                maxLength={30}
                                                value={engravingTexts[key] ?? ''}
                                                onChange={e => setEngravingTexts(prev => ({ ...prev, [key]: e.target.value }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="order-summary">
                            <div className="order-summary__title">{t.summary}</div>
                            {items.map(l => (
                                <div className="order-summary__line" key={`${l.id}-${l.variant}`}>
                                    <span>{l.product.name}{l.variant ? ` — ${l.variant}` : ''} × {l.qty}</span>
                                    <span className="num">{fmt(linePrice(l) * l.qty, cartT.currency)}</span>
                                </div>
                            ))}
                            <div className="order-summary__line">
                                <span>{cartT.ship}</span>
                                <span>{ship === 0 ? cartT.shipFree : <span className="num">{fmt(ship, cartT.currency)}</span>}</span>
                            </div>
                            <div className="order-summary__total">
                                <span>{cartT.total}</span>
                                <span className="num">{fmt(subtotal + ship, cartT.currency)}</span>
                            </div>
                        </div>

                        {errors.items && <p style={{ color: 'var(--warn)', fontSize: 13, marginBottom: 12 }}>{errors.items}</p>}

                        <button type="submit" className="btn btn--full btn--lg" disabled={submitting} style={{ marginTop: 8 }}>
                            {submitting ? t.submitting : t.submit}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ---- TOAST ----
function Toast({ message, on }: { message: string; on: boolean }) {
    return (
        <div className={`toast${on ? ' on' : ''}`} role="status">
            <CheckIcon /> {message}
        </div>
    );
}

// ---- HOME PAGE ----
function HomePage({ lang, navigate, products, addToCart, heroImage, heroContent }: {
    lang: Lang;
    navigate: (r: string, pid?: number | null, cat?: string | null) => void;
    products: Product[];
    addToCart: (id: number, variant?: string | null) => void;
    heroImage: string | null;
    heroContent: HeroContent;
}) {
    const t = COPY[lang];
    const pill  = lang === 'en' ? (heroContent.pill_en  || t.hero.pill)  : (heroContent.pill_ar  || t.hero.pill);
    const title = lang === 'en' ? (heroContent.title_en || null)          : (heroContent.title_ar || null);
    const lede  = lang === 'en' ? (heroContent.lede_en  || t.hero.lede)  : (heroContent.lede_ar  || t.hero.lede);
    const featured = products.slice(0, 8);

    const dynamicCats = useMemo(() => {
        const map = new Map<string, number>();
        for (const p of products) {
            if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1);
        }
        return Array.from(map.entries()).map(([name, count]) => {
            const key = Object.keys(CAT_ICON_MAP).find(k => name.toLowerCase().includes(k.toLowerCase())) ?? '';
            return { name, count, icon: CAT_ICON_MAP[key] ?? 'diag' };
        });
    }, [products]);

    return (
        <>
            <section className="hero">
                <div className="wrap">
                    <div className="hero__grid">
                        <div className="hero__copy">
                            <span className="pill"><span className="dot" />{pill}</span>
                            <h1 className="h1">
                                {title
                                    ? title
                                    : <>{t.hero.title_a}<em>{t.hero.title_em}</em>{t.hero.title_b}</>}
                            </h1>
                            <p className="body-lg hero__lede">{lede}</p>
                            <div className="hero__cta">
                                <button className="btn btn--lg" onClick={() => navigate('collection')}>
                                    {t.hero.cta_primary} <span className="arrow"><ArrowIcon /></span>
                                </button>
                                <button className="btn btn--ghost btn--lg" onClick={() => navigate('how')}>
                                    {t.hero.cta_ghost}
                                </button>
                            </div>
                            <div className="hero__trust">
                                {t.hero.trust.map((tr, i) => (
                                    <div key={i}><FeatureIcon kind={tr.i} /><span>{tr.t}</span></div>
                                ))}
                            </div>
                        </div>
                        <div className="hero__media">
                            {heroImage && <img src={heroImage} alt={t.hero.title_a + t.hero.title_em + t.hero.title_b} />}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="wrap">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">{t.sections.cats.eye}</span>
                            <h2 className="h2">{t.sections.cats.title}</h2>
                        </div>
                        <button className="link-btn" onClick={() => navigate('collection')}>
                            {t.cats_cta} <ArrowIcon />
                        </button>
                    </div>
                    <div className="cats">
                        {dynamicCats.map(c => (
                            <button key={c.name} className="cat" onClick={() => navigate('collection', null, c.name)}>
                                <div className="cat__icon"><CatIconComp kind={c.icon} /></div>
                                <div>
                                    <div className="cat__count">{c.count} {lang === 'en' ? 'items' : 'منتج'}</div>
                                    <h3 className="cat__name">{c.name}</h3>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div className="cat__arrow"><ArrowIcon /></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">{t.sections.featured.eye}</span>
                            <h2 className="h2">{t.sections.featured.title}</h2>
                        </div>
                        <button className="link-btn" onClick={() => navigate('collection')}>
                            {t.feats_cta} <ArrowIcon />
                        </button>
                    </div>
                    <div className="col-grid" style={{ paddingBottom: 0 }}>
                        {featured.map(p => (
                            <ProductCard key={p.id} product={p} lang={lang} onAdd={prod => addToCart(prod.id)} onNavigate={prod => navigate('product', prod.id)} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="wrap">
                    <div className="features__grid">
                        {t.features.map((f, i) => (
                            <div className="feature" key={i}>
                                <div className="feature__icon"><FeatureIcon kind={f.i} /></div>
                                <h3>{f.t}</h3>
                                <p>{f.b}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="wrap">
                    <div className="section-head">
                        <div>
                            <span className="eyebrow">{t.sections.how.eye}</span>
                            <h2 className="h2">{t.sections.how.title}</h2>
                        </div>
                        <div />
                    </div>
                    <div className="steps">
                        {t.steps.map((s, i) => (
                            <div className="step" key={i}>
                                <div className="step__num">STEP {s.n}</div>
                                <h3>{s.t}</h3>
                                <p>{s.b}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="unis">
                <div className="wrap">
                    <div className="unis__title">{t.sections.unis}</div>
                    <div className="unis__list">
                        {t.universities.map((u, i) => (
                            <div className="uni" key={i}>
                                <span>{u.name}</span>
                                <small>{u.short}</small>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

// ---- COLLECTION PAGE ----
function CollectionPage({ lang, products, navigate, addToCart, initialCat }: {
    lang: Lang;
    products: Product[];
    navigate: (r: string, pid?: number | null, cat?: string | null) => void;
    addToCart: (id: number, variant?: string | null) => void;
    initialCat: string | null;
}) {
    const t = COPY[lang].col;
    const allCategories = useMemo(() => {
        const cats = products.map(p => p.category).filter(Boolean) as string[];
        return [...new Set(cats)].sort();
    }, [products]);

    const [filter, setFilter] = useState<string | null>(initialCat);
    const [sort, setSort] = useState<'default' | 'price_asc' | 'price_desc' | 'name'>('default');
    const [inStockOnly, setInStockOnly] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { setFilter(initialCat); }, [initialCat]);

    const filtered = useMemo(() => {
        let list = filter ? products.filter(p => {
            const cat = p.category?.toLowerCase() ?? '';
            return cat.includes(filter.toLowerCase()) || filter.toLowerCase().includes(cat);
        }) : products;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.category ?? '').toLowerCase().includes(q) ||
                (p.excerpt ?? '').toLowerCase().includes(q)
            );
        }
        if (inStockOnly) list = list.filter(p => p.stock_status === 'in_stock');
        if (sort === 'price_asc') list = [...list].sort((a, b) => Number(a.sale_price ?? a.price) - Number(b.sale_price ?? b.price));
        else if (sort === 'price_desc') list = [...list].sort((a, b) => Number(b.sale_price ?? b.price) - Number(a.sale_price ?? a.price));
        else if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [products, filter, sort, inStockOnly, search]);

    const allLabel = lang === 'en' ? 'All' : 'الكلّ';

    const sortLabels = lang === 'en'
        ? { default: 'Default', price_asc: 'Price: low → high', price_desc: 'Price: high → low', name: 'Name A–Z' }
        : { default: 'الافتراضي', price_asc: 'السعر: الأقلّ', price_desc: 'السعر: الأعلى', name: 'الاسم أ–ي' };

    return (
        <>
            <section className="col-hero">
                <div className="wrap">
                    <div className="col-hero__grid">
                        <div>
                            <span className="eyebrow">{t.eye}</span>
                            <h1 className="h1">{t.title}</h1>
                        </div>
                        <p className="body-lg">{t.lede}</p>
                    </div>
                </div>
            </section>
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div className="col-layout">
                        {/* Sticky sidebar */}
                        <aside className="col-sidebar">
                            <div className="col-sidebar__section">
                                <div className="col-sidebar__label">{lang === 'en' ? 'Category' : 'الفئة'}</div>
                                <div className="col-sidebar__filters">
                                    <button className={!filter ? 'on' : ''} onClick={() => setFilter(null)} aria-pressed={!filter}>
                                        {allLabel}
                                    </button>
                                    {allCategories.map(cat => (
                                        <button key={cat} className={filter === cat ? 'on' : ''} onClick={() => setFilter(cat)} aria-pressed={filter === cat}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-sidebar__section">
                                <div className="col-sidebar__label">{lang === 'en' ? 'Sort' : 'الترتيب'}</div>
                                <div className="col-sidebar__filters">
                                    {(Object.keys(sortLabels) as (keyof typeof sortLabels)[]).map(k => (
                                        <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
                                            {sortLabels[k]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-sidebar__section">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={inStockOnly}
                                        onChange={e => setInStockOnly(e.target.checked)}
                                        style={{ accentColor: 'var(--ink)', width: 14, height: 14 }}
                                    />
                                    {lang === 'en' ? 'In stock only' : 'المتوفّر فقط'}
                                </label>
                                <div className="col-sidebar__count">
                                    <span className="num">{filtered.length}</span> {t.count}
                                </div>
                            </div>
                        </aside>

                        {/* Main content */}
                        <div className="col-main">
                            <div style={{ position: 'relative', marginBottom: 24 }}>
                                <div style={{ position: 'absolute', insetInlineStart: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-mute)', pointerEvents: 'none' }}>
                                    <SearchIcon />
                                </div>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={lang === 'en' ? 'Search products…' : 'ابحث عن منتج…'}
                                    style={{
                                        width: '100%',
                                        padding: '12px 44px',
                                        border: '1px solid var(--rule)',
                                        borderRadius: 6,
                                        background: 'var(--paper)',
                                        color: 'var(--ink)',
                                        fontSize: 15,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        aria-label="Clear search"
                                        style={{ position: 'absolute', insetInlineEnd: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center' }}
                                    >
                                        <CloseIcon />
                                    </button>
                                )}
                            </div>
                    <div className="col-grid">
                        {filtered.length > 0
                            ? filtered.map(p => (
                                <ProductCard key={p.id} product={p} lang={lang} onAdd={prod => addToCart(prod.id)} onNavigate={prod => navigate('product', prod.id)} />
                            ))
                            : (
                                <div style={{ gridColumn: '1/-1', padding: '48px 0', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 15 }}>
                                    {lang === 'en' ? `No products match "${search}"` : `لا منتجات تطابق "${search}"`}
                                </div>
                            )
                        }
                    </div>
                        </div>{/* /col-main */}
                    </div>{/* /col-layout */}
                </div>{/* /wrap */}
            </section>
        </>
    );
}

// ---- PRODUCT PDP ----
function ProductPage({ lang, productId, navigate, products, addToCart }: {
    lang: Lang;
    productId: number;
    navigate: (r: string, pid?: number | null, cat?: string | null) => void;
    products: Product[];
    addToCart: (id: number, variant?: string | null) => void;
}) {
    const t = COPY[lang].pdp;
    const cartT = COPY[lang].cart;
    const product = products.find(p => p.id === productId) ?? products[0];
    const [qty, setQty] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [variantError, setVariantError] = useState('');

    useEffect(() => { setQty(1); setSelectedVariant(null); setVariantError(''); }, [productId]);

    if (!product) {
        return (
            <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
                <p className="body-lg">{lang === 'en' ? 'Product not found.' : 'المنتج غير موجود.'}</p>
                <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('collection')}>
                    {lang === 'en' ? 'Browse all' : 'تصفّح الكلّ'} <span className="arrow"><ArrowIcon /></span>
                </button>
            </div>
        );
    }

    const variants = product.variants ?? [];
    const hasVariants = variants.length > 0;
    const activeVariant = variants.find(v => v.value === selectedVariant) ?? null;

    const basePrice = Number(product.price);
    const baseSalePrice = product.sale_price ? Number(product.sale_price) : null;
    const displayPrice = activeVariant
        ? Number(activeVariant.price)
        : (baseSalePrice && baseSalePrice < basePrice ? baseSalePrice : basePrice);
    const showStrikethrough = !activeVariant && baseSalePrice && baseSalePrice < basePrice;

    const displayImage = activeVariant?.image ?? product.featured_image;
    const inStock = product.stock_status === 'in_stock';
    const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);

    function handleAddToCart() {
        if (hasVariants && !selectedVariant) {
            setVariantError(lang === 'en' ? 'Please select an option.' : 'يرجى اختيار خيار.');
            return;
        }
        setVariantError('');
        addToCart(product.id, selectedVariant);
        if (qty > 1) {
            for (let i = 1; i < qty; i++) addToCart(product.id, selectedVariant);
        }
    }

    return (
        <>
            <section className="wrap pdp">
                <div className="pdp__media-main">
                    {displayImage ? (
                        <img src={displayImage} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <PHolder accent="default" label={product.category ?? 'product'} />
                    )}
                </div>
                <div className="pdp__side">
                    <div className="pdp__crumbs">
                        <button onClick={() => navigate('collection')}>{t.crumbs}</button>
                        {product.category && <> / {product.category}</>}
                    </div>
                    {product.category && <div className="pdp__cat">{product.category}</div>}
                    <h1 className="pdp__title">{product.name}</h1>
                    {product.excerpt && <p className="pdp__sub">{product.excerpt}</p>}
                    <div className="pdp__price-row">
                        <div className="pdp__price">
                            <span className="num">{fmt(displayPrice * qty, cartT.currency)}</span>
                        </div>
                        {showStrikethrough && (
                            <>
                                <div className="pdp__price-old">
                                    <span className="num">{fmt(basePrice * qty, cartT.currency)}</span>
                                </div>
                                <div className="pdp__price-save">
                                    {lang === 'en' ? 'Save ' : 'وفّر '}
                                    <span className="num">{fmt((basePrice - baseSalePrice!) * qty, cartT.currency)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Variant picker */}
                    {hasVariants && (
                        <div style={{ marginTop: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 10 }}>
                                {lang === 'en' ? 'Options' : 'الخيارات'}
                                {selectedVariant && (
                                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginInlineStart: 8, color: 'var(--ink)' }}>
                                        — {selectedVariant}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {variants.map(v => {
                                    const sel = selectedVariant === v.value;
                                    return (
                                        <button
                                            key={v.value}
                                            onClick={() => { setSelectedVariant(v.value); setVariantError(''); }}
                                            style={{
                                                padding: '7px 14px',
                                                fontSize: 13,
                                                border: sel ? '2px solid var(--ink)' : '1px solid var(--rule)',
                                                background: sel ? 'var(--ink)' : 'var(--paper)',
                                                color: sel ? 'var(--paper)' : 'var(--ink)',
                                                cursor: 'pointer',
                                                borderRadius: 'var(--tbk-radius)',
                                                transition: 'all 0.12s',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {v.value}
                                            {v.price && <span style={{ marginInlineStart: 6, opacity: 0.7, fontSize: 12 }}>{fmt(v.price, cartT.currency)}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {variantError && (
                                <p style={{ fontSize: 13, color: 'var(--warn, #c0392b)', marginTop: 8 }}>{variantError}</p>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--ink)' }}>{t.qty}</div>
                        <div className="pdp__actions">
                            <div className="qty">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                                <span className="v">{qty}</span>
                                <button onClick={() => setQty(q => q + 1)} aria-label="Increase quantity">+</button>
                            </div>
                            <button
                                className="btn btn--full btn--lg"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                style={!inStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                <BagIcon /> {inStock ? t.addCart : (lang === 'en' ? 'Out of stock' : 'نفذت الكمّية')}
                                {inStock && <span className="arrow"><ArrowIcon /></span>}
                            </button>
                        </div>
                    </div>

                    {product.description && (
                        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--rule-soft)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 10 }}>
                                {t.specsTitle}
                            </div>
                            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-line' }}>{product.description}</p>
                        </div>
                    )}

                    <div className="pdp__assurances">
                        {t.assurances.map((a, i) => (
                            <div key={i}>
                                <FeatureIcon kind={a.i} />
                                <div>
                                    <div className="k">{a.k}</div>
                                    <div className="v">{a.v}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="section">
                    <div className="wrap">
                        <div className="section-head">
                            <div><h2 className="h2">{t.relatedTitle}</h2></div>
                            <div />
                        </div>
                        <div className="col-grid" style={{ paddingBottom: 0 }}>
                            {related.map(rp => (
                                <ProductCard key={rp.id} product={rp} lang={lang} onAdd={prod => addToCart(prod.id)} onNavigate={prod => navigate('product', prod.id)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}

// ---- BUNDLES PAGE ----
function BundlesPage({ lang, navigate }: { lang: Lang; navigate: (r: string) => void }) {
    const t = COPY[lang];
    const bp = t.bundlesPage;
    const cur = t.cart.currency;

    const otherBundles = [
        {
            tag:    { en: 'Year 5 · OSCE Kit',   ar: 'السنة الخامسة · حزمة OSCE' },
            title:  { en: 'OSCE Preparation Kit', ar: 'حزمة التحضير لـ OSCE' },
            lede:   { en: 'Suture pad, instruments, two reference handbooks, and a station-by-station checklist.', ar: 'وسادة خياطة وأدوات وكتيّبا مرجع وقائمة فحص لكلّ محطّة.' },
            price: 95, priceOld: 118, accent: 'default',
        },
        {
            tag:    { en: 'Surgery rotation',        ar: 'جولة الجراحة' },
            title:  { en: 'Surgical Rotation Kit',   ar: 'حزمة جولة الجراحة' },
            lede:   { en: 'Surgical loupes, suture practice, scrub cap, and a pocket surgical handbook.', ar: 'نظّارات تكبير، تدريب الخياطة، قبّعة جراحيّة، وكتيّب جيب للجراحة.' },
            price: 165, priceOld: 195, accent: 'terra',
        },
        {
            tag:    { en: 'Internal medicine',          ar: 'الطبّ الباطني' },
            title:  { en: 'Internal Medicine Starter',  ar: 'حزمة البدء في الباطني' },
            lede:   { en: 'Stethoscope, BP cuff, pulse oximeter, and Oxford handbook of clinical medicine.', ar: 'سمّاعة، جهاز ضغط، مقياس أكسجين، وكتيّب أكسفورد للطبّ السريري.' },
            price: 175, priceOld: 215, accent: 'green',
        },
    ];

    return (
        <>
            <section className="col-hero">
                <div className="wrap">
                    <div className="col-hero__grid">
                        <div>
                            <span className="eyebrow">{bp.eye}</span>
                            <h1 className="h1">{bp.title}</h1>
                        </div>
                        <p className="body-lg">{bp.lede}</p>
                    </div>
                </div>
            </section>

            <section style={{ padding: '48px 0' }}>
                <div className="bundle__wrap">
                    <div className="bundle__inner">
                        <div className="bundle__copy">
                            <span className="eyebrow">{BUNDLE.badge[lang]}</span>
                            <h2 className="h2">{BUNDLE.title[lang]}</h2>
                            <p className="body-lg">{BUNDLE.lede[lang]}</p>
                            <ul className="bundle__includes">
                                {BUNDLE.items.map((it, i) => (
                                    <li key={i}><CheckIcon /> {it[lang]}</li>
                                ))}
                            </ul>
                            <div className="bundle__price-row">
                                <span className="bundle__price"><span className="num">{cur} {BUNDLE.price}</span></span>
                                <span className="bundle__price-old"><span className="num">{cur} {BUNDLE.priceOld}</span></span>
                                <span className="bundle__save">{lang === 'en' ? `Save ${cur} ${BUNDLE.save}` : `وفّر ${BUNDLE.save} ${cur}`}</span>
                            </div>
                            <div className="bundle__cta">
                                <button className="btn btn--accent btn--lg" onClick={() => navigate('collection')}>
                                    {t.bundle.cta_primary} <span className="arrow"><ArrowIcon /></span>
                                </button>
                            </div>
                        </div>
                        <div className="bundle__media">
                            <PHolder accent="terra" label={lang === 'en' ? 'year-4 kit' : 'حزمة السنة الرابعة'} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="section" style={{ paddingTop: 0 }}>
                <div className="wrap">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                        {otherBundles.map((b, i) => (
                            <div key={i} style={{ background: 'var(--paper-2)', borderRadius: 'var(--tbk-radius-lg)', overflow: 'hidden' }}>
                                <div style={{ aspectRatio: '4/3', position: 'relative' }}>
                                    <PHolder accent={b.accent} label={lang === 'en' ? 'bundle photo' : 'صورة الحزمة'} />
                                </div>
                                <div style={{ padding: 24 }}>
                                    <span className="eyebrow">{b.tag[lang]}</span>
                                    <h3 className="h3" style={{ marginTop: 10 }}>{b.title[lang]}</h3>
                                    <p className="body" style={{ marginTop: 8, marginBottom: 18 }}>{b.lede[lang]}</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                                        <span className="num" style={{ fontSize: 22, fontWeight: 600 }}>{cur} {b.price}</span>
                                        <span className="num" style={{ color: 'var(--ink-mute)', textDecoration: 'line-through', fontSize: 14 }}>{cur} {b.priceOld}</span>
                                    </div>
                                    <button className="btn btn--full" onClick={() => navigate('collection')}>
                                        {lang === 'en' ? 'Browse items' : 'تصفّح المنتجات'} <span className="arrow"><ArrowIcon /></span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

// ---- HOW IT WORKS PAGE ----
function HowPage({ lang, navigate }: { lang: Lang; navigate: (r: string) => void }) {
    const t = COPY[lang];
    return (
        <>
            <section className="col-hero">
                <div className="wrap">
                    <div className="col-hero__grid">
                        <div>
                            <span className="eyebrow">{t.sections.how.eye}</span>
                            <h1 className="h1">{t.sections.how.title}</h1>
                        </div>
                        <p className="body-lg">
                            {lang === 'en'
                                ? "We're an independent medical supplier in Amman, run by alumni of Jordan's medical schools. Built to be the simplest, most affordable way for med students to get clinical-year equipment."
                                : 'نحن مورّد مستقلّ للمعدّات الطبيّة في عمّان، يديره خرّيجون من كلّيّات الطبّ الأردنيّة. أسّسناه ليكون أبسط وأرخص طريقة لطلبة الطبّ للحصول على معدّات السنة السريريّة.'}
                        </p>
                    </div>
                </div>
            </section>
            <section className="section">
                <div className="wrap">
                    <div className="steps">
                        {t.steps.map((s, i) => (
                            <div className="step" key={i}>
                                <div className="step__num">STEP {s.n}</div>
                                <h3>{s.t}</h3>
                                <p>{s.b}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="features">
                <div className="wrap">
                    <div className="features__grid">
                        {t.features.map((f, i) => (
                            <div className="feature" key={i}>
                                <div className="feature__icon"><FeatureIcon kind={f.i} /></div>
                                <h3>{f.t}</h3>
                                <p>{f.b}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="section" style={{ textAlign: 'center' }}>
                <div className="wrap" style={{ maxWidth: 720 }}>
                    <span className="eyebrow">{lang === 'en' ? 'Ready to shop' : 'جاهز للتسوّق'}</span>
                    <h2 className="h2" style={{ marginTop: 12, marginBottom: 16 }}>
                        {lang === 'en'
                            ? 'Browse all products or shop by category.'
                            : 'تصفّح كلّ المنتجات أو تسوّق حسب الفئة.'}
                    </h2>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
                        <button className="btn btn--lg" onClick={() => navigate('collection')}>
                            {t.hero.cta_primary} <span className="arrow"><ArrowIcon /></span>
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

// ---- MAIN COMPONENT ----
interface HeroContent {
    pill_en: string | null; pill_ar: string | null;
    title_en: string | null; title_ar: string | null;
    lede_en: string | null; lede_ar: string | null;
}

interface Props {
    products: Product[];
    categories: string[];
    hero_image: string | null;
    hero_content: HeroContent;
}

export default function StoreIndex({ products, hero_image, hero_content }: Props) {
    const [lang, setLang] = useState<Lang>('en');
    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem('tbk_dark') !== 'false'; } catch { return true; }
    });
    const [route, setRoute] = useState('home');
    const [productId, setProductId] = useState<number | null>(null);
    const [initialCat, setInitialCat] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>(() => {
        try { return JSON.parse(localStorage.getItem('tbk_cart') ?? '[]') as CartItem[]; } catch { return []; }
    });
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [toast, setToast] = useState({ on: false, msg: '' });

    useEffect(() => {
        document.documentElement.classList.add('tibbak');
        initSmoothScroll();
        return () => document.documentElement.classList.remove('tibbak');
    }, []);

    useEffect(() => {
        if (dark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        try { localStorage.setItem('tbk_dark', dark ? 'true' : 'false'); } catch {}
    }, [dark]);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = COPY[lang].dir;
    }, [lang]);

    useEffect(() => {
        localStorage.setItem('tbk_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        killAllAnimations();
        // Delay one frame so DOM is painted before animating
        const id = requestAnimationFrame(() => {
            if (route === 'home') {
                animateHero('.tbk .hero');
                animateSectionsOnScroll();
            } else if (route === 'collection') {
                animateCollectionSidebar();
                animateSectionsOnScroll();
            } else if (route === 'product') {
                animatePDP();
            }
        });
        return () => cancelAnimationFrame(id);
    }, [route, productId]);

    function navigate(r: string, pid?: number | null, cat?: string | null) {
        setRoute(r);
        if (pid != null) setProductId(pid);
        if (cat !== undefined) setInitialCat(cat ?? null);
        setCartOpen(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function showToast(msg: string) {
        setToast({ on: true, msg });
        setTimeout(() => setToast(t => ({ ...t, on: false })), 1800);
    }

    function addToCart(id: number, variant: string | null = null) {
        setCart(c => {
            const found = c.find(l => l.id === id && l.variant === variant);
            if (found) return c.map(l => l.id === id && l.variant === variant ? { ...l, qty: l.qty + 1 } : l);
            return [...c, { id, qty: 1, variant }];
        });
        showToast(COPY[lang].addedToast);
        setCartOpen(true);
    }

    const cartCount = cart.reduce((s, l) => s + l.qty, 0);
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <div className="tbk">
            <Head>
                <title>Tibbuk — طِبّك · Medical Equipment for Jordan's Med Students</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Amiri:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <a className="skip" href="#main">{lang === 'en' ? 'Skip to content' : 'تخطّى إلى المحتوى'}</a>
            <MetaStrip t={COPY[lang]} />
            <Header lang={lang} setLang={setLang} dark={dark} setDark={setDark} route={route} navigate={navigate} cartCount={cartCount} openCart={() => setCartOpen(true)} openSearch={() => setSearchOpen(true)} />
            <main id="main">
                {route === 'home' && <HomePage lang={lang} navigate={navigate} products={products} addToCart={addToCart} heroImage={hero_image} heroContent={hero_content} />}
                {route === 'collection' && <CollectionPage lang={lang} products={products} navigate={navigate} addToCart={addToCart} initialCat={initialCat} />}
                {route === 'product' && productId !== null && <ProductPage lang={lang} productId={productId} navigate={navigate} products={products} addToCart={addToCart} />}
                {route === 'how' && <HowPage lang={lang} navigate={navigate} />}
            </main>
            <Footer lang={lang} navigate={navigate} />
            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                lang={lang}
                cart={cart}
                setCart={setCart}
                products={products}
                navigate={navigate}
                onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
            />
            <CheckoutModal
                open={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                cart={cart}
                products={products}
                lang={lang}
            />
            {searchOpen && (
                <SearchOverlay
                    lang={lang}
                    products={products}
                    onClose={() => setSearchOpen(false)}
                    navigate={navigate}
                    addToCart={addToCart}
                />
            )}
            <Toast message={toast.msg} on={toast.on} />
        </div>
    );
}
