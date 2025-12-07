
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(protected)" | "/" | "/api" | "/api/chat" | "/api/conversations" | "/api/conversations/status" | "/api/manual-reply" | "/api/webhook" | "/api/whatsapp" | "/(protected)/configuracion" | "/(protected)/conversaciones" | "/(protected)/conversaciones/[id]" | "/(protected)/dashboard" | "/login" | "/(protected)/perfil" | "/privacidad" | "/recovery" | "/register" | "/(protected)/sandbox" | "/(protected)/sandbox/chat" | "/terminos" | "/(protected)/usuarios";
		RouteParams(): {
			"/(protected)/conversaciones/[id]": { id: string }
		};
		LayoutParams(): {
			"/(protected)": { id?: string };
			"/": { id?: string };
			"/api": Record<string, never>;
			"/api/chat": Record<string, never>;
			"/api/conversations": Record<string, never>;
			"/api/conversations/status": Record<string, never>;
			"/api/manual-reply": Record<string, never>;
			"/api/webhook": Record<string, never>;
			"/api/whatsapp": Record<string, never>;
			"/(protected)/configuracion": Record<string, never>;
			"/(protected)/conversaciones": { id?: string };
			"/(protected)/conversaciones/[id]": { id: string };
			"/(protected)/dashboard": Record<string, never>;
			"/login": Record<string, never>;
			"/(protected)/perfil": Record<string, never>;
			"/privacidad": Record<string, never>;
			"/recovery": Record<string, never>;
			"/register": Record<string, never>;
			"/(protected)/sandbox": Record<string, never>;
			"/(protected)/sandbox/chat": Record<string, never>;
			"/terminos": Record<string, never>;
			"/(protected)/usuarios": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/chat" | "/api/chat/" | "/api/conversations" | "/api/conversations/" | "/api/conversations/status" | "/api/conversations/status/" | "/api/manual-reply" | "/api/manual-reply/" | "/api/webhook" | "/api/webhook/" | "/api/whatsapp" | "/api/whatsapp/" | "/configuracion" | "/configuracion/" | "/conversaciones" | "/conversaciones/" | `/conversaciones/${string}` & {} | `/conversaciones/${string}/` & {} | "/dashboard" | "/dashboard/" | "/login" | "/login/" | "/perfil" | "/perfil/" | "/privacidad" | "/privacidad/" | "/recovery" | "/recovery/" | "/register" | "/register/" | "/sandbox" | "/sandbox/" | "/sandbox/chat" | "/sandbox/chat/" | "/terminos" | "/terminos/" | "/usuarios" | "/usuarios/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.ico" | "/robots.txt" | "/tortas/bizcocho/tortaAlpina.webp" | "/tortas/bizcocho/tortaAlpina2.webp" | "/tortas/bizcocho/tortaChocolate.webp" | "/tortas/bizcocho/tortaChocolate2.webp" | "/tortas/bizcocho/tortaDulceLeche.webp" | "/tortas/bizcocho/tortaDulceLeche2.webp" | "/tortas/bizcocho/tortaDurazno3.webp" | "/tortas/bizcocho/tortaFrambuesa.webp" | "/tortas/bizcocho/tortaFrambuesa2.webp" | "/tortas/bizcocho/tortaFrutalDurazno.webp" | "/tortas/bizcocho/tortaMani.webp" | "/tortas/bizcocho/tortaMani2.webp" | "/tortas/bizcocho/tortaManjarNuez.webp" | "/tortas/bizcocho/tortaManjarNuez2.webp" | "/tortas/bizcocho/tortaMaracuya.webp" | "/tortas/bizcocho/tortaMaracuya2.webp" | "/tortas/bizcocho/tortaMenta.webp" | "/tortas/bizcocho/tortaMenta2.webp" | "/tortas/bizcocho/tortaMoka.webp" | "/tortas/bizcocho/tortaMoka2.webp" | "/tortas/bizcocho/tortaRedVelvet.webp" | "/tortas/bizcocho/tortaRedVelvet2.webp" | "/tortas/bizcocho/tortaRose.webp" | "/tortas/bizcocho/tortaRose3.webp" | "/tortas/bizcocho/tortaSelvaNegra.webp" | "/tortas/bizcocho/tortaSelvaNegra2.webp" | "/tortas/bizcocho/tortaSelvaNegra3.webp" | "/tortas/bizcocho/tortaTresLeches.webp" | "/tortas/bizcocho/tortaTresLeches2.webp" | "/tortas/bizcocho/tortaTrufa.webp" | "/tortas/bizcocho/tortaTrufa2.webp" | "/tortas/hojarasca/tortaAmor.webp" | "/tortas/hojarasca/tortaAmor2.webp" | "/tortas/hojarasca/tortaCelestial.webp" | "/tortas/hojarasca/tortaCelestial2.webp" | "/tortas/hojarasca/tortaMilHojas.webp" | "/tortas/hojarasca/tortaMilHojas2.webp" | string & {};
	}
}