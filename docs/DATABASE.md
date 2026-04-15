# OpenAA Marketplace - Database Documentation

## Tables

### `users`
Extends Supabase's built-in `auth.users` table.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key, references auth.users |
| `email` | TEXT | User email address |
| `username` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture URL |
| `bio` | TEXT | Short bio |
| `phone` | TEXT | Contact phone |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `secondhand_items`
Second-hand item listings.

| Column | Type | Description |
|---|---|---|
| `id` | BIGSERIAL | Auto-increment primary key |
| `user_id` | UUID | References users.id |
| `title` | TEXT | Item title |
| `description` | TEXT | Item description |
| `price` | NUMERIC(10,2) | Price in USD |
| `category` | TEXT | Item category |
| `images` | TEXT[] | Array of image URLs |
| `status` | TEXT | `published` or `unpublished` |
| `views` | INTEGER | View count |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `job_postings`
Job listings.

| Column | Type | Description |
|---|---|---|
| `id` | BIGSERIAL | Auto-increment primary key |
| `user_id` | UUID | References users.id |
| `title` | TEXT | Job title |
| `company` | TEXT | Company name |
| `description` | TEXT | Job description |
| `salary_min` | NUMERIC(10,2) | Minimum salary (USD/year) |
| `salary_max` | NUMERIC(10,2) | Maximum salary (USD/year) |
| `location` | TEXT | Work location |
| `job_type` | TEXT | Full-time, part-time, etc. |
| `category` | TEXT | Job category |
| `status` | TEXT | `published` or `unpublished` |
| `views` | INTEGER | View count |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Row Level Security

All tables use RLS to ensure users can only modify their own data while allowing public read access to published content.

## Storage Buckets

- `item-images`: Public bucket for secondhand item photos
- `avatars`: Public bucket for user profile pictures
