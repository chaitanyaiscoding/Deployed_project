# Complete Deployment Guide: React + Django on AWS EC2

## Project Overview
- **Frontend**: React with TypeScript (Vite)
- **Backend**: Django (Python)
- **Server**: AWS EC2 (Ubuntu)
- **Web Server**: Nginx
- **Process Manager**: Supervisor (for Django)
- **Production Server**: Gunicorn

---

## Prerequisites
- AWS Account
- EC2 Instance created (Ubuntu)
- Security Group configured
- GitHub repository with your project
- SSH key pair for EC2 access

---

## Step 1: Configure EC2 Security Group

### Required Inbound Rules:
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | 0.0.0.0/0 or My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic (optional) |

**Important**: Do NOT open port 8000 publicly. Django runs internally behind Nginx.

---

## Step 2: Connect to EC2 Instance

```bash
ssh -i "path/to/your-key.pem" ubuntu@your-ec2-public-ip
```

---

## Step 3: Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (for React)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python and tools (for Django)
sudo apt install -y python3 python3-pip python3-venv

# Install Nginx (web server)
sudo apt install -y nginx

# Install Supervisor (keeps Django running)
sudo apt install -y supervisor

# Verify installations
node --version
npm --version
python3 --version
nginx -v
```

---

## Step 4: Clone Your Project

```bash
cd /home/ubuntu
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

**Project Structure:**
```
your-repo/
├── backendapp/         # Django project
│   ├── manage.py
│   ├── backendapp/     # Django settings
│   └── ...
├── frontend-app/       # React project
│   ├── package.json
│   ├── src/
│   └── ...
└── venv/              # Python virtual environment
```

---

## Step 5: Set Up Django Backend

```bash
cd /home/ubuntu/your-repo/backendapp

# Activate virtual environment
source ../venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Gunicorn (production server)
pip install gunicorn

# Configure Django settings
nano backendapp/settings.py
```

### Update `settings.py`:
```python
# Change these settings for production
DEBUG = False

ALLOWED_HOSTS = ['your-ec2-ip', 'your-domain.com', 'localhost', '127.0.0.1']

# CORS settings (if using)
INSTALLED_APPS = [
    # ... other apps
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware
]

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

```bash
# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Test Gunicorn
gunicorn --bind 127.0.0.1:8000 backendapp.wsgi:application
# Press Ctrl+C to stop after testing
```

---

## Step 6: Configure Supervisor (Keep Django Running)

```bash
sudo nano /etc/supervisor/conf.d/django.conf
```

Add this configuration:
```ini
[program:django]
command=/home/ubuntu/your-repo/venv/bin/gunicorn --bind 127.0.0.1:8000 backendapp.wsgi:application
directory=/home/ubuntu/your-repo/backendapp
user=ubuntu
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/django.log
stderr_logfile=/var/log/django_err.log
```

Start Django with Supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start django
sudo supervisorctl status  # Should show RUNNING
```

---

## Step 7: Build React Frontend

### Important: Update API URLs for Production

Before building, update your React code:

**Change:**
```javascript
fetch('http://localhost:8000/api/endpoint/')
```

**To:**
```javascript
fetch('/api/endpoint/')  // Relative URL
```

Push changes to GitHub:
```bash
# On your local machine
git add .
git commit -m "Fix API URLs for production"
git push
```

Pull and build on EC2:
```bash
cd /home/ubuntu/your-repo
git pull origin main

cd frontend-app

# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist` (or `build`) folder with optimized static files.

---

## Step 8: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/default
```

Replace everything with:
```nginx
server {
    listen 80;
    server_name your-ec2-ip;

    # Serve React frontend
    location / {
        root /home/ubuntu/your-repo/frontend-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Django backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static files
    location /static/ {
        alias /home/ubuntu/your-repo/backendapp/staticfiles/;
    }

    # Django media files (if applicable)
    location /media/ {
        alias /home/ubuntu/your-repo/backendapp/media/;
    }
}
```

**Note:** Change `dist` to `build` if your React build folder is named `build`.

---

## Step 9: Fix Permissions

Nginx needs permission to access your files:

```bash
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/your-repo
sudo chmod 755 /home/ubuntu/your-repo/frontend-app
sudo chmod -R 755 /home/ubuntu/your-repo/frontend-app/dist
```

---

## Step 10: Test and Start Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test successful, restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

## Step 11: Verify Deployment

### Test from EC2:
```bash
# Test if Django is running
sudo supervisorctl status

# Test if site is accessible
curl http://your-ec2-ip

# Test API endpoint
curl http://your-ec2-ip/api/random-paragraph/
```

### Test from Browser:
- **Homepage**: `http://your-ec2-ip`
- **Django Admin**: `http://your-ec2-ip/admin/`
- **API Endpoint**: `http://your-ec2-ip/api/random-paragraph/`

---

## Deployment Architecture

```
[User Browser]
       ↓
   Port 80 (HTTP)
       ↓
   [Nginx Web Server]
       ├─→ Static Files (React) → /home/ubuntu/your-repo/frontend-app/dist
       └─→ /api/* requests → Proxy to Django
                                    ↓
                            [Gunicorn] Port 8000 (internal)
                                    ↓
                            [Django Backend]
```

---

## Useful Commands

### Managing Django (Supervisor)
```bash
sudo supervisorctl status           # Check status
sudo supervisorctl stop django      # Stop Django
sudo supervisorctl start django     # Start Django
sudo supervisorctl restart django   # Restart Django
sudo tail -f /var/log/django.log    # View logs
```

### Managing Nginx
```bash
sudo systemctl status nginx         # Check status
sudo systemctl restart nginx        # Restart
sudo systemctl stop nginx           # Stop
sudo systemctl start nginx          # Start
sudo nginx -t                       # Test configuration
sudo tail -f /var/log/nginx/error.log  # View error logs
```

### Updating Your Application
```bash
# Pull latest code
cd /home/ubuntu/your-repo
git pull origin main

# Update backend
cd backendapp
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo supervisorctl restart django

# Update frontend
cd ../frontend-app
npm install
npm run build
sudo systemctl restart nginx
```

---

## Troubleshooting

### 500 Internal Server Error
```bash
# Check Nginx error logs
sudo tail -n 50 /var/log/nginx/error.log

# Check Django logs
sudo tail -n 50 /var/log/django.log

# Verify permissions
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 /home/ubuntu/your-repo/frontend-app/dist
```

### Django Not Running
```bash
# Check Supervisor status
sudo supervisorctl status

# View Django logs
sudo tail -f /var/log/django.log

# Restart Django
sudo supervisorctl restart django
```

### API Calls Failing
- Ensure API URLs in React use relative paths: `/api/endpoint/` not `http://localhost:8000/api/endpoint/`
- Check CORS settings in Django `settings.py`
- Verify Nginx proxy configuration

### Can't SSH to EC2
- Check Security Group has port 22 open
- Verify correct IP address and key file
- Check key file permissions: `chmod 400 your-key.pem`

---

## Security Best Practices

1. **Never expose port 8000** - Django should only be accessible via Nginx
2. **Set DEBUG = False** in production
3. **Use environment variables** for sensitive data (SECRET_KEY, database credentials)
4. **Restrict SSH access** to your IP in Security Group
5. **Keep packages updated**: `sudo apt update && sudo apt upgrade`
6. **Use HTTPS** with SSL certificates (Let's Encrypt)
7. **Set up backups** for your database and code

---

## Next Steps (Optional)

### 1. Set Up a Domain Name
- Purchase domain from registrar
- Point A record to EC2 IP
- Update `ALLOWED_HOSTS` in Django settings
- Update `server_name` in Nginx config

### 2. Enable HTTPS with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Set Up Environment Variables
```bash
# Install python-decouple
pip install python-decouple

# Create .env file
nano /home/ubuntu/your-repo/backendapp/.env
```

### 4. Configure Database (PostgreSQL)
```bash
sudo apt install postgresql postgresql-contrib
# Configure PostgreSQL and update Django settings
```

### 5. Set Up Monitoring
- CloudWatch for AWS metrics
- Application monitoring (Sentry, New Relic)
- Log aggregation

---

## Summary

✅ EC2 instance configured with proper security groups
✅ System packages and dependencies installed
✅ Django backend running with Gunicorn + Supervisor
✅ React frontend built and served by Nginx
✅ Nginx configured as reverse proxy
✅ Application accessible via HTTP on port 80

**Your application is now live at:** `http://your-ec2-ip`

---

## Additional Resources

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Supervisor Documentation](http://supervisord.org/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

---

**Deployed by:** [Your Name]  
**Date:** January 05, 2026  
**EC2 IP:** 3.26.7.247
