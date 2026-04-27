# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by emailing the maintainers directly. Do not create public GitHub issues for security vulnerabilities.

## Security Measures

### Authentication & Authorization

- **Supabase Auth**: Email/password authentication with secure session management
- **Row Level Security (RLS)**: All database tables protected with RLS policies
- **Role-Based Access Control**: User roles (user, seller, admin) with appropriate permissions
- **Admin-Only Routes**: Protected routes for moderation and administrative functions

### Data Protection

- **Environment Variables**: Sensitive credentials stored in `.env.local` (never committed)
- **Server-Only Modules**: Critical logic marked with `"server-only"` to prevent client-side exposure
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Prevention**: React's built-in escaping + Content Security Policy headers

### API Security

- **Rate Limiting**: IP-based rate limiting on API routes
- **CSRF Protection**: Next.js built-in CSRF protection for mutations
- **Webhook Verification**: Iyzico webhook signatures verified with SHA256
- **CORS Configuration**: Restricted to allowed origins only

### Infrastructure Security

- **HTTPS Only**: All production traffic over HTTPS
- **Secure Headers**: Security headers configured in `next.config.ts`
- **Dependency Scanning**: Automated security audits via GitHub Actions
- **Dependabot**: Weekly dependency updates for security patches

### Content Moderation

- **Admin Moderation**: All listings require admin approval before publication
- **User Reporting**: Users can report suspicious listings
- **Ban System**: Admins can ban users and hide their listings
- **Content Filtering**: Automated checks for prohibited content

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use `.env.local` for sensitive data
2. **Use `server-only`**: Mark server-side logic with `"server-only"` import
3. **Validate all inputs**: Use Zod schemas for validation
4. **Follow RLS patterns**: Always use RLS policies, never bypass with service role key in client code
5. **Review dependencies**: Check `npm audit` before adding new packages
6. **Test security**: Include security tests in your PRs

### For Deployment

1. **Rotate credentials**: Rotate all API keys and secrets before production deployment
2. **Enable monitoring**: Set up error tracking and security monitoring
3. **Review logs**: Regularly review application and security logs
4. **Update dependencies**: Keep all dependencies up-to-date
5. **Backup data**: Regular database backups with encryption

## Security Audit History

For detailed security audit history and resolved issues, see:
- `docs/archive/security/` - Historical security reports and resolutions
- `PROGRESS.md` - Recent security improvements and fixes

## Compliance

This application follows security best practices for:
- OWASP Top 10 protection
- GDPR data protection principles (for EU users)
- Secure payment processing (PCI DSS considerations via Iyzico)

## Contact

For security concerns, please contact the project maintainers directly.
