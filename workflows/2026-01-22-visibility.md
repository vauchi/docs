# Visibility Labels Workflow

Step-by-step guide for managing what contact information different people can see.

## Overview

Visibility labels let you organize contacts into groups (Family, Friends, Professional) and control which fields each group can see. This means you can share your personal phone with family while showing only your work email to colleagues.

## Concepts

### Labels

Labels are groups of contacts with shared visibility settings:

- **Family** - Close family members
- **Friends** - Personal friends
- **Professional** - Work contacts, clients
- **Custom** - Any label you create

### Fields

Fields are pieces of information on your contact card:

- Phone numbers (Personal, Work)
- Email addresses
- Physical addresses
- Social media handles
- Custom fields

### Default Visibility

When you add a new contact or field:

- New contacts see all fields by default
- New fields are visible to all contacts by default
- You can change this at any time

## Creating Labels

### Create a Label

1. Go to **Settings** > **Visibility Labels**
2. Tap **Create New Label**
3. Enter a name (e.g., "University Friends")
4. Tap **Create**

### Suggested Labels

On first use, Vauchi suggests common labels:

- Family
- Friends
- Professional

Tap any suggestion to create it instantly.

## Assigning Contacts to Labels

### Add Contact to Label

1. Go to **Contacts**
2. Tap on a contact
3. Tap **Manage Labels**
4. Check the labels that apply
5. Tap **Done**

### Bulk Assignment

1. Go to **Settings** > **Visibility Labels**
2. Tap a label
3. Tap **Add Contacts**
4. Select multiple contacts
5. Tap **Add**

### Contact in Multiple Labels

Contacts can belong to multiple labels. They see the union of all visible fields from their labels.

## Setting Field Visibility

### Configure Label Visibility

1. Go to **Settings** > **Visibility Labels**
2. Tap a label (e.g., "Professional")
3. Tap **Visible Fields**
4. Toggle fields on/off:
   - ON: Contacts in this label see this field
   - OFF: Contacts in this label don't see this field
5. Changes apply immediately

### Example Configuration

| Field | Family | Friends | Professional |
|-------|--------|---------|--------------|
| Personal Phone | Yes | Yes | No |
| Work Phone | No | No | Yes |
| Personal Email | Yes | Yes | No |
| Work Email | No | No | Yes |
| Home Address | Yes | No | No |

## Per-Contact Overrides

Override label visibility for specific contacts:

1. Go to **Contacts**
2. Tap on a contact
3. Tap **Field Visibility**
4. Toggle individual fields
5. Overrides take precedence over label settings

## Managing Labels

### Rename a Label

1. Go to **Settings** > **Visibility Labels**
2. Tap the label
3. Tap **Rename**
4. Enter new name
5. Tap **Save**

Contacts and field associations are preserved.

### Delete a Label

1. Go to **Settings** > **Visibility Labels**
2. Tap the label
3. Tap **Delete**
4. Confirm deletion

When deleted:
- Contacts remain in your contact list
- Contacts revert to default visibility (see all fields)
- Consider reassigning to another label first

## How Visibility Works

When a contact views your card:

1. Vauchi checks which labels they belong to
2. Gathers visible fields from all their labels
3. Checks for per-contact overrides
4. Shows only the allowed fields

Updates are re-encrypted per contact with their visible fields only.

## Privacy Guarantees

- Contacts don't know what labels they're in
- Contacts don't know what fields are hidden
- Hidden fields are never transmitted
- Changes sync automatically to contacts

## Common Scenarios

### Separating Work and Personal

1. Create "Professional" and "Personal" labels
2. Add work email and work phone to your card
3. Make them visible only to "Professional"
4. Add personal info visible only to "Personal"
5. New work contacts go in "Professional"

### Sharing Address with Family Only

1. Create "Family" label
2. Add your home address field
3. Make address visible only to "Family"
4. Only family members see your address

### VIP Treatment

1. Create "VIP" label
2. Make all fields visible to VIP
3. Add special contacts to VIP
4. They see everything

## Best Practices

1. **Start Simple**: Use suggested labels first
2. **Review Periodically**: Check who's in each label
3. **Use Overrides Sparingly**: Labels are easier to manage
4. **Test Visibility**: Check what specific contacts see via their profile

## Feature File Reference

See: `features/visibility_labels.feature`, `features/visibility_control.feature`
