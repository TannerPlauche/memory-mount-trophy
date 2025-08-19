# Modal Component

A reusable modal component with TrophyPage styling consistency.

## Features

- **Responsive Design**: Matches TrophyPage styling with gray-800 background and proper spacing
- **Size Variants**: 4 different sizes (sm, md, lg, xl) to fit different content needs
- **Accessibility**: Full ARIA support, keyboard navigation, and focus management
- **User Experience**: Backdrop click to close, Escape key support, body scroll prevention
- **TypeScript**: Fully typed for better development experience

## Usage

### Basic Modal

```tsx
import Modal from '@/app/components/Modal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal"
      >
        <p>This is the modal content!</p>
      </Modal>
    </>
  );
}
```

### Form Modal with TrophyPage Styling

```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Edit Trophy"
  size="lg"
>
  <form className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Trophy Name
      </label>
      <input
        type="text"
        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter trophy name..."
      />
    </div>
    
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={() => setIsModalOpen(false)}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  </form>
</Modal>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Whether the modal is visible |
| `onClose` | `() => void` | - | Function called when modal should close |
| `title` | `string` | - | Optional title displayed in header |
| `children` | `React.ReactNode` | - | Modal content |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size variant |
| `showCloseButton` | `boolean` | `true` | Whether to show the X close button |

## Size Reference

- **sm**: `max-w-md` (~448px)
- **md**: `max-w-2xl` (~672px) - Default
- **lg**: `max-w-3xl` (~768px) - Matches TrophyPage
- **xl**: `max-w-4xl` (~896px)

## Styling

The modal uses the same design language as TrophyPage:
- Background: `bg-gray-800`
- Border: `border-gray-700`
- Text: `text-gray-100`
- Inputs: `bg-gray-700` with `border-gray-600`
- Focus: `focus:ring-blue-500`
- Buttons: Blue (`bg-blue-600`) and Gray (`bg-gray-600`) variants

## Accessibility

- Traps focus within the modal
- Closes on Escape key
- Prevents body scroll when open
- Proper ARIA attributes
- Screen reader friendly

## Testing

The component includes comprehensive tests covering:
- Rendering states
- User interactions
- Keyboard navigation
- Accessibility features
- Size variants

Run tests with: `npm test -- --testPathPatterns=Modal.test.tsx`
