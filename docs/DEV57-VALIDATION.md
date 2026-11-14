# dev57 rare achievement decoration

Adds a cyan/royal-blue faceted rim, metallic highlights, star field and glint around original Steam achievement artwork. Applies only to verified finite global unlock percentages in [0,10), matching the existing Rare/Ultra rare labels. It does not change achievement states or assign trophy tiers.

TypeScript and three existing page navigation/comparison tests passed. Browser preview using placeholder artwork fits 1280x800, 1920x1080, 2560x1440 and 3840x2160 without horizontal overflow. Inspected the 1080p render. Browser computed-style checks confirm only the focused row animates and reduced motion disables all star animations. Detail view uses the same decoration; inert list rows stop animation while a dialog is open.

Production build and package integrity verified during packaging. Live controller and SteamOS rendering still require user testing. No third-party plugin source or music settings changed in this update. Rollback archives preserve dev56; no GitHub publication.
