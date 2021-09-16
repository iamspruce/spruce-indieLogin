# What is spruceAuth?

spruceAuth is a NodeJs implementation of [IndieLogin.com](https://indielogin.com/) that makes it easy to add web sign-in to your applications.
[spruceAuth](https://indie.iamspruce.dev) uses RelMe links that allows users to log in with their own domain name.
With spruceAuth users don't have to create new accounts, the service will use the user's already created Social accounts, e.g Github or passwordless login with email verification and it dosen't really matter what the user authenticate with the identity provided to the application will always be the user's primary website.

# For users: How to Set Up Your Website for spruceAuth

You are here probably because the website you are trying to log in to uses spruceAuth to handle logging users in.

You don't have to create a new account, rather we'll use some accounts you may already have in order to authenticate you. You can always choose the services you use to log in, and the site you're logging in to won't know about this.

## Supported Providers

a. Github
b. Email Address

## Github

To use GitHub, link to your GitHub profile on your home page.

```
<a href="https://github.com/iamspruce" rel="me">github.com/iamspruce</a>
```

Make sure your GitHub account has your URL in your profile. If you don't want to add Github link to your website you can use invisible link

```
<link href="https://github.com/iamspruce" rel="me">
```

## Email Address

To use your email address to authenticate, you'll receive a varification link. Just link to your email address from your home page.

```
<a href="mailto:me@example.com" rel="me">me@example.com</a>
```

If you don't want to add Email Address link to your website you can use invisible link
```
<link href="mailto:me@example.com" rel="me">
```

# for Developers: Using spruceAuth

Using spruceAuth to handle logging users only takes four steps. Users will identity themselves with their website and will be asked to authenticate using one of the available authentication provider

## 1. Create a Web Sign-In form

```
<form action="https://indie.iamspruce.dev/auth" method="get">
  <label for="url">Web Address:</label>
  <input id="url" type="text" name="me" placeholder="yourdomain.com" />
  <p><button type="submit">Sign In</button></p>
  <input type="hidden" name="client_id" value="https://example.com/" />
  <input type="hidden" name="redirect_uri" value="https://example.com/redirect" />
  <input type="hidden" name="state" value="somerandomstring" />
</form>
```

### Parameters

action: Set the action of the form to this service (https://indie.iamspruce.dev/auth). It is highly recommended that you run your own server(download the source)

me: (optional) The "me" parameter is the URL that the user enters. If you leave this out, then the user will be prompted to enter it, before authentication.

client_id: Set the client_id in a hidden field to let this site know the home page of the application the user is signing in to.

redirect_uri: Set the redirect_uri in a hidden field to let this site know where to redirect back to after authentication is complete. It must be on the same domain as the client_id.

state: You should generate a random value that you will check after the user is redirected back.

## 2. The user logs in with their domain

When the user enters their domain in the web sign in form and submits, spruceAuth will scan their website looking for links with _rel="me"_ that are supported providers.

The user will then authenticate with one of the supported provider.

## 3. The user is redirected back to your site

If the user authenticated successfully the user would be redirected back to the redirect_uri you specified in the form:

`https://example.com/callback?code=gk7n4opsyuUxhvF4&state=somerandomstring`

The redirect*uri will contain two query parameters \_code & state*, you have to check if the state is still the same as the one you sent with the form, if it's not the same then don't continue.

## 4. Verify the authorization code

In this step you need to exchange the code for the authenticatedusers website. to do so you need to make a POST request to *https://indie.iamspruce.dev/auth* with the code, client_id and redirect_uri.

```
POST https://indie.iamspruce.dev/auth HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Accept: application/json

code=gk7n4opsyuUxhvF4&
redirect_uri=https://example.com/callback&
client_id=https://example.com/
```

If all is successful you will get a successful response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
"me": "https://iamspruce.dev/"
}
```

## 5. There's no step 5

You don't have to worry about which authorization provider the user used as you will always get the user domain name as response.

For a more detailed guide on how to implement spruceAuth and the story behind it. please read this article:

Spruce Emmanuel
