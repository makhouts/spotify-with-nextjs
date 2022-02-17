import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify";
import spotifyApi, {LOGIN_URL} from '../../../lib/spotify';

async function refreshAccesToken(token){
  try{
    spotifyApi.setAccesToken(token.accesToken);
    spotifyApi.setRefreshToken(token.refreshToken);

    const {body: refreshedToken} = await spotifyApi.refreshAccesToken();

    return{
      ...token,
      accesToken: refreshedToken.acces_token,
      accesTokenExpires: Date.now + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    }

  }catch(error) {
    return{
      ...token,
      error: 'refreshAccesToken'
    }
  }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, account, user }){
      if(account && user) {
        return {
          ...token,
          accesToken: account.acces_token,
          refreshToken: account.refresh.token,
          username: account.providerAccountId,
          accesTokenExpires: account.expires_at * 1000,

        }
      }

      if(Date.now < token.accesTokenExpires) {
        return token;
      };

      return await refreshAccesToken(token);
    },

    async session({ session, token }) {
      session.user.accesToken = token.accesToken; 
      session.user.refreshToken = token.refreshToken;
      session.user.username = token.username;
    }
  }
});