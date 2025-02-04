# First Build
ARG GITHUB_TOKEN
FROM node:16.20.1-alpine AS build
ARG GITHUB_TOKEN
RUN mkdir -p /home/phoenix-nps/app && mkdir -p /home/phoenix-nps/app/build
ENV GITHUB_TOKEN $GITHUB_TOKEN
WORKDIR /home/phoenix-nps/app
COPY package.json ./
RUN echo //npm.pkg.github.com/:_authToken=$GITHUB_TOKEN >> ~/.npmrc \
    && echo @moxfive-llc:registry=https://npm.pkg.github.com/ >> ~/.npmrc \
    && npm install --ignore-scripts \
    && echo > ~/.npmrc
COPY . .

# Second build
FROM node:16.20.1-alpine
WORKDIR /home/phoenix-nps/app
EXPOSE 3000
COPY --from=build /home/phoenix-nps/app /home/phoenix-nps/app
RUN npm run build
USER node
CMD ["npm", "start"]
