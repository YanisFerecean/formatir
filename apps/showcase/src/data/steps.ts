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
    short: 'Personal details',
    title: 'Personal details',
    description: 'So we know who is applying. Required fields are marked.',
    fields: [
      {
        name: 'firstName',
        label: 'First name',
        type: 'text',
        required: true,
        placeholder: 'Alex',
        autoComplete: 'given-name',
      },
      {
        name: 'lastName',
        label: 'Last name',
        type: 'text',
        required: true,
        placeholder: 'Bergmann',
        autoComplete: 'family-name',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'alex.bergmann@example.com',
        autoComplete: 'email',
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'tel',
        required: true,
        placeholder: '+44 7700 900123',
        pattern: '^[+0-9 ()/-]{8,}$',
        hint: 'At least 8 characters, digits and + ( ) / - only',
        autoComplete: 'tel',
      },
      { name: 'birthdate', label: 'Date of birth', type: 'date', required: true },
      {
        name: 'city',
        label: 'City',
        type: 'text',
        required: true,
        placeholder: 'Berlin',
        autoComplete: 'address-level2',
      },
    ],
  },
  {
    id: 'experience',
    short: 'Experience',
    title: 'CV & work experience',
    description:
      'The section where applications are typically abandoned - exactly where Formatir measures the effort.',
    fields: [
      {
        name: 'position',
        label: 'Current position',
        type: 'text',
        required: true,
        placeholder: 'Senior Frontend Engineer',
        span: 2,
      },
      {
        name: 'employer',
        label: 'Current employer',
        type: 'text',
        required: true,
        placeholder: 'Northwind Ltd.',
      },
      {
        name: 'experience',
        label: 'Work experience',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Please choose' },
          { value: '0-1', label: 'Less than 1 year' },
          { value: '1-3', label: '1-3 years' },
          { value: '3-6', label: '3-6 years' },
          { value: '6-10', label: '6-10 years' },
          { value: '10+', label: 'More than 10 years' },
        ],
      },
      {
        name: 'skills',
        label: 'Core skills',
        type: 'textarea',
        required: true,
        rows: 3,
        minLength: 40,
        span: 2,
        placeholder: 'TypeScript, React, Design Systems, Web Performance ...',
        hint: 'At least 40 characters - a classic candidate for corrections and refills.',
      },
      {
        name: 'portfolio',
        label: 'Portfolio / LinkedIn',
        type: 'url',
        placeholder: 'https://',
        hint: 'Optional, but must be a full URL.',
      },
      {
        name: 'salary',
        label: 'Salary expectation (EUR / year)',
        type: 'number',
        required: true,
        min: '0',
        max: '500000',
        placeholder: '75000',
        hint: 'Below EUR 20,000 the demo reports a custom validation error.',
      },
    ],
  },
  {
    id: 'questions',
    short: 'Questions',
    title: 'Additional questions',
    description: 'Free text and choices - where the longest hesitation happens.',
    fields: [
      { name: 'availability', label: 'Available from', type: 'date', required: true },
      {
        name: 'relocation',
        label: 'Willing to relocate',
        type: 'select',
        required: true,
        options: [
          { value: '', label: 'Please choose' },
          { value: 'yes', label: 'Yes, within the country' },
          { value: 'eu', label: 'Yes, within the EU' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        name: 'workModel',
        label: 'Preferred work model',
        type: 'radio',
        required: true,
        span: 2,
        options: [
          { value: 'remote', label: 'Remote' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'onsite', label: 'On-site' },
        ],
      },
      {
        name: 'motivation',
        label: 'Cover letter',
        type: 'textarea',
        required: true,
        rows: 5,
        minLength: 120,
        span: 2,
        placeholder: 'What excites you about this role?',
        hint: 'At least 120 characters.',
      },
      {
        name: 'referral',
        label: 'How did you hear about us?',
        type: 'text',
        placeholder: 'Referral, job board, event ...',
        span: 2,
      },
    ],
  },
  {
    id: 'review',
    short: 'Review',
    title: 'Review & submit',
    description: 'Final check - and the moment when abandonment is most expensive.',
    fields: [
      {
        name: 'consent',
        label: 'I agree to the processing of my application data.',
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
