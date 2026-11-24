import { ScrollViewStyleReset } from 'expo-router/html';
import React, { type PropsWithChildren } from 'react';

/**
 * Plantilla HTML base para la versión web en desarrollo.
 * Asegura que el contenedor #root y body ocupen el 100% de la pantalla con el tema oscuro.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                background-color: #121417;
                color: #F3F4F6;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
