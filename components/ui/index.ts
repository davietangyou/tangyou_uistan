/**
 * Foundational UI primitives for the sage/ink design system.
 * Since Stage 9 every reachable view and the app shell use them. The unwired
 * DetailView and MedicationReminders still use the legacy Tailwind styling;
 * do not add .ds-root there without a restyle stage.
 */
export {cx} from './cx';
export {Button, type ButtonProps, type ButtonVariant} from './Button';
export {Card, type CardProps} from './Card';
export {Field, type FieldProps} from './Field';
export {Icon} from './Icon';
export {Segmented, type SegmentedOption, type SegmentedProps} from './Segmented';
export {StatTile, type StatTileProps, type StatTone} from './StatTile';
export {UI_ICON_DEFAULTS, uiIcons, type UiIconName} from './icons';
