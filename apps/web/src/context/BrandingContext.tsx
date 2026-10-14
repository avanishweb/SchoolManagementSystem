import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ISchool, ISchoolBranding } from '@smart-school/shared-types';
import { DEFAULT_SCHOOL_BRANDING } from '@smart-school/shared-utils';
import { schoolService } from '../services/schoolService.js';
import { useAuth } from './AuthContext.js';

interface BrandingContextType {
  branding: ISchoolBranding;
  school: ISchool | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { school: authSchool, isAuthenticated } = useAuth();
  const [school, setSchool] = useState<ISchool | null>(authSchool);
  const [branding, setBranding] = useState<ISchoolBranding>(authSchool?.branding || DEFAULT_SCHOOL_BRANDING);
  const [loading, setLoading] = useState<boolean>(false);

  const applyThemeColors = useCallback((brand: ISchoolBranding, schoolName?: string) => {
    const root = document.documentElement;
    const primary = brand.primaryColor || '#4f46e5';
    const secondary = brand.secondaryColor || '#0f172a';
    const accent = brand.accentColor || '#06b6d4';

    root.style.setProperty('--color-brand-primary', primary);
    root.style.setProperty('--color-brand-secondary', secondary);
    root.style.setProperty('--color-brand-accent', accent);

    if (schoolName) {
      document.title = `${schoolName} — Smart School ERP`;
    }

    if (brand.faviconUrl) {
      let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = brand.faviconUrl;
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const current = await schoolService.getCurrentSchool();
      setSchool(current);
      const brand = current.branding || DEFAULT_SCHOOL_BRANDING;
      setBranding(brand);
      applyThemeColors(brand, current.name);
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applyThemeColors]);

  useEffect(() => {
    if (authSchool) {
      setSchool(authSchool);
      const brand = authSchool.branding || DEFAULT_SCHOOL_BRANDING;
      setBranding(brand);
      applyThemeColors(brand, authSchool.name);
    } else {
      // Try resolving by host domain for public landing/login
      const currentHost = window.location.host;
      if (currentHost && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
        schoolService
          .resolvePublic(undefined, currentHost)
          .then((pub) => {
            if (pub && pub.branding) {
              setBranding(pub.branding);
              applyThemeColors(pub.branding, pub.name);
            }
          })
          .catch(() => {});
      }
    }
  }, [authSchool, applyThemeColors]);

  return (
    <BrandingContext.Provider value={{ branding, school, loading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
