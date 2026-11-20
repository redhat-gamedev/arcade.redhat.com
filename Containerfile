# arcade.redhat.com container image
#
# Replaces the previous S2I (Source strategy) build in OpenShift.
# The site is fully static — index.html and build/ are committed to the
# repo pre-built (see README: edit content.toml, run `npm run build`,
# commit the result). This image simply serves those files with httpd.
#
# Base image: registry.access.redhat.com/hi/httpd (Red Hat "Project
# Hummingbird" Apache httpd image, UBI-based)
#   - runs as non-root user `apache` (uid 48); log/run dirs are
#     group-0 writable and the PidFile lives in /tmp, so it works under
#     OpenShift's restricted SCCs with arbitrary UIDs as well
#   - listens on port 8080, DocumentRoot /var/www/html
#   - entrypoint: /usr/bin/httpd -DFOREGROUND
#   - SHELL-LESS: there is no /bin/sh (or any shell) in the image, so
#     RUN is impossible. Everything below is plain COPY, which is
#     executed by the builder itself and needs no shell. File removal
#     is therefore done by overwriting with benign content instead.
#
# `:latest` was verified as sha256:22456793b8ffc7e1b181a679a59af73a70e
# 481cd49b10496820b6e797a5ebd21 (httpd 2.4.71, built 2026-11-13).
# Consider pinning to that digest or a dated tag for reproducible builds.

FROM registry.access.redhat.com/hi/httpd:latest

LABEL io.k8s.display-name="arcade.redhat.com" \
      io.k8s.description="Static site for arcade.redhat.com (Red Hat Open Source Arcade)" \
      io.openshift.expose-services="8080:http"

# Neutralize the base image's /etc/httpd/conf.d/ssl.conf by overwriting
# it: the original listens on 8443 and requires
# /etc/pki/tls/certs/localhost.crt — a file that is not present in the
# image, so httpd would refuse to start. TLS is terminated at the
# OpenShift router, so in-pod TLS is unnecessary.
COPY httpd-cnf/ssl.conf /etc/httpd/conf.d/ssl.conf

# Site-specific httpd configuration (see httpd-cnf/arcade.conf).
# The base image sets AllowOverride None, so the repo's .htaccess file
# is ignored; arcade.conf applies the same rule at server level.
COPY httpd-cnf/arcade.conf /etc/httpd/conf.d/arcade.conf

# Static site content -> DocumentRoot. .dockerignore keeps .git,
# node_modules/, ssl/, IDE files, cluster backups, and the openshift/
# plumbing out of the image; everything else (index.html, build/,
# images, ...) is served, matching what the S2I build served before.
#
# The httpd-cnf/ files land in the docroot too (COPY . cannot exclude
# files that other COPY steps need), but arcade.conf denies web access
# to /httpd-cnf.
COPY . /var/www/html
