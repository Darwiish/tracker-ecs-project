# Serve static frontend files with Nginx
FROM nginx:alpine

# Copy static site files directly into Nginx's web root
COPY index.html style.css app.js /usr/share/nginx/html/

# Optional: custom Nginx config (only needed if you add client-side routing later)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]