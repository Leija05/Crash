import React from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { info } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

const DifferenceSection = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    
    return (
        <section id="diferencia" data-testid="difference-section" className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
                <h2 className="text-4xl font-black text-foreground mb-8 leading-none tracking-tight">
                    {t('difference.title')}
                </h2>
                <p className="text-lg text-muted-foreground">
                    {t('difference.description')}
                </p>
            </div>
        </section>

    )};

export default DifferenceSection;