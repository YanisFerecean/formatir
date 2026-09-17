export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'url'
  | 'number'
  | 'select'
  | 'textarea'
  | 'radio'
  | 'checkbox';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
  rows?: number;
  /** Grid columns the field occupies (of 2). */
  span?: 1 | 2;
  autoComplete?: string;
}

export interface StepDef {
  id: string;
  title: string;
  short: string;
  description: string;
  fields: FieldDef[];
}

export const STEPS: StepDef[] = [
  {
    id: 'personal',
    short: 'Persönliche Daten',
    title: 'Persönliche Daten',
    description: 'Damit wir wissen, wer sich bewirbt. Pflichtfelder sind markiert.',
    fields: [
      {
        name: 'firstName',
        label: 'Vorname',
        type: 'text',
        required: true,
        placeholder: 'Alex',
        autoComplete: 'given-name',
      },
      {
        name: 'lastName',
        label: 'Nachname',
        type: 'text',
        required: true,
        placeholder: 'Bergmann',
        autoComplete: 'family-name',
      },
      {
        name: 'email',
        label: 'E-Mail',
        type: 'email',
        required: true,
        placeholder: 'alex.bergmann@example.com',
        autoComplete: 'email',
      },
      {
        name: 'phone',
        label: 'Telefon',
        type: 'tel',
        required: true,
        placeholder: '+49 151 23456789',
        pattern: '^[+0-9 ()/-]{8,}$',
        hint: 'Mindestens 8 Zeichen, nur Ziffern und + ( ) / -',
        autoComplete: 'tel',
      },
      { name: 'birthdate', label: 'Geburtsdatum', type: 'date', required: true },
      {
        name: 'city',
        label: 'Wohnort',
        type: 'text',
        required: true,
        placeholder: 'Berlin',
        autoComplete: 'address-level2',
      },
    ],
  },
  {
    id: 'experience',
    short: 'Lebenslauf',
    title: 'Lebenslauf & Berufserfahrung',
    description:
      'Der Abschnitt, an dem Bewerbungen typischerweise abbrechen - genau hier misst Formatir den Aufwand.',
    fields: [
      {
        name: 'position',
        label: 'Aktuelle Position',
        type: 'text',
        required: true,
        placeholder: 'Senior Frontend Engineer',
        span: 2,
      },
      {
        name: 'employer',
        label: 'Aktueller Arbeitgeber',
        type: 'text',
        required: true,
        placeholder: 'Nordwind GmbH',
      },
      {
        name: 'experience',
        label: 'Berufserfahrung',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Bitte wählen' },
          { value: '0-1', label: 'Weniger als 1 Jahr' },
          { value: '1-3', label: '1-3 Jahre' },
          { value: '3-6', label: '3-6 Jahre' },
          { value: '6-10', label: '6-10 Jahre' },
          { value: '10+', label: 'Mehr als 10 Jahre' },
        ],
      },
      {
        name: 'skills',
        label: 'Kernkompetenzen',
        type: 'textarea',
        required: true,
        rows: 3,
        minLength: 40,
        span: 2,
        placeholder: 'TypeScript, React, Design Systems, Web Performance ...',
        hint: 'Mindestens 40 Zeichen - ein klassischer Kandidat für Korrekturen und Refills.',
      },
      {
        name: 'portfolio',
        label: 'Portfolio / LinkedIn',
        type: 'url',
        placeholder: 'https://',
        hint: 'Optional, muss aber eine vollständige URL sein.',
      },
      {
        name: 'salary',
        label: 'Gehaltsvorstellung (EUR / Jahr)',
        type: 'number',
        required: true,
        min: '0',
        max: '500000',
        placeholder: '75000',
        hint: 'Unter 20.000 EUR meldet die Demo einen eigenen Validierungsfehler.',
      },
    ],
  },
  {
    id: 'questions',
    short: 'Zusatzfragen',
    title: 'Zusatzfragen',
    description: 'Freitext und Auswahl - hier entstehen die längsten Zögerzeiten.',
    fields: [
      { name: 'availability', label: 'Verfügbar ab', type: 'date', required: true },
      {
        name: 'relocation',
        label: 'Umzugsbereitschaft',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Bitte wählen' },
          { value: 'yes', label: 'Ja, deutschlandweit' },
          { value: 'eu', label: 'Ja, innerhalb der EU' },
          { value: 'no', label: 'Nein' },
        ],
      },
      {
        name: 'workModel',
        label: 'Bevorzugtes Arbeitsmodell',
        type: 'radio',
        required: true,
        span: 2,
        options: [
          { value: 'remote', label: 'Remote' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'onsite', label: 'Vor Ort' },
        ],
      },
      {
        name: 'motivation',
        label: 'Motivationsschreiben',
        type: 'textarea',
        required: true,
        rows: 5,
        minLength: 120,
        span: 2,
        placeholder: 'Was reizt Sie an dieser Rolle?',
        hint: 'Mindestens 120 Zeichen.',
      },
      {
        name: 'referral',
        label: 'Wie haben Sie von uns erfahren?',
        type: 'text',
        placeholder: 'Empfehlung, Jobbörse, Event ...',
        span: 2,
      },
    ],
  },
  {
    id: 'review',
    short: 'Review',
    title: 'Review & Absenden',
    description: 'Letzte Kontrolle - und der Moment, in dem Abbrüche besonders teuer sind.',
    fields: [
      {
        name: 'consent',
        label: 'Ich stimme der Verarbeitung meiner Bewerbungsdaten zu.',
        type: 'checkbox',
        required: true,
        span: 2,
      },
    ],
  },
];

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  STEPS.flatMap((step) => step.fields.map((f) => [f.name, f.label])),
);
