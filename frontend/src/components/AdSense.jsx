import React, { useEffect } from 'react';

const AdSense = ({ adSlot, adFormat = 'auto', fullWidthResponsive = true }) => {
    useEffect(() => {
        try {
            // This is required to initialize the ad
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense initialization error:', e);
        }
    }, []);

    // Show placeholder in development
    const isDev = import.meta.env.DEV;

    return (
        <div className="my-12 w-full overflow-hidden">
            {isDev ? (
                <div className="pop-card bg-bg flex flex-col items-center justify-center min-h-[250px] border-dashed opacity-50">
                    <span className="font-black text-xs uppercase tracking-[0.3em] mb-4">Advertisement Placeholder</span>
                    <div className="w-[300px] h-[250px] bg-surface border-2 border-text flex items-center justify-center">
                        <span className="font-bold text-text-light">300 x 250 AD UNIT</span>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center">
                    <ins className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                        data-ad-slot={adSlot || "YYYYYYYYYYYY"}
                        data-ad-format={adFormat}
                        data-full-width-responsive={fullWidthResponsive.toString()}
                    ></ins>
                </div>
            )}
        </div>
    );
};

export default AdSense;
