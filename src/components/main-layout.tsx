import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { FileText, BookText, Languages, UploadCloud, MousePointerClick, Volume2 } from 'lucide-react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <div className="flex flex-col">
              <span className="font-headline text-xl font-semibold tracking-tight">
                LEXIFY
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
              <SidebarGroup>
                <SidebarGroupLabel>How it Works</SidebarGroupLabel>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="h-auto py-2 text-wrap justify-start items-start">
                    <UploadCloud className="text-primary mt-1"/>
                    <span className="flex flex-col">
                      <b className="font-headline">1. Upload Document:</b>
                      <span className="whitespace-normal">Click or drag & drop a TXT, PDF, JPG or PNG file.</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="h-auto py-2 text-wrap justify-start items-start">
                    <FileText className="text-primary mt-1"/>
                    <span className="flex flex-col">
                      <b className="font-headline">2. Get Summary:</b>
                      <span className="whitespace-normal">The AI provides a clear summary of your document.</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="h-auto py-2 text-wrap justify-start items-start">
                    <MousePointerClick className="text-primary mt-1"/>
                    <span className="flex flex-col">
                      <b className="font-headline">3. Explain Clauses:</b>
                      <span className="whitespace-normal">Select text in the document for a simple explanation.</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="h-auto py-2 text-wrap justify-start items-start">
                    <Languages className="text-primary mt-1"/>
                    <span className="flex flex-col">
                      <b className="font-headline">4. Translate:</b>
                      <span className="whitespace-normal">Translate the summary into various languages.</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="h-auto py-2 text-wrap justify-start items-start">
                    <Volume2 className="text-primary mt-1"/>
                    <span className="flex flex-col">
                      <b className="font-headline">5. Read Aloud:</b>
                      <span className="whitespace-normal">Listen to summaries, explanations, and translations.</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className='relative z-10'>
          <header className="flex h-12 items-center px-4 md:hidden border-b">
            <SidebarTrigger />
          </header>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
