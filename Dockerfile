FROM node:9.5.0
ENV NODE_ENV production
ENV PORT 3000
ENV MEDIA_ROOT /opt/contentjet-api/media/
EXPOSE 3000
COPY package.json package-lock.json spec.yml docker-start.sh /opt/contentjet-api/
COPY dist/ /opt/contentjet-api/dist/
COPY templates/ /opt/contentjet-api/templates/
VOLUME /opt/contentjet-api/media
WORKDIR /opt/contentjet-api/
RUN npm install --production
RUN chmod +x docker-start.sh
CMD ./docker-start.sh
