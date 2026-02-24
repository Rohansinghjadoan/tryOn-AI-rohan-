export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-xl font-bold text-foreground mb-2">TryOnAI</div>
            <p className="text-sm text-muted-foreground">
              AI Virtual Try-On for E-Commerce Brands
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground mb-1">
              Contact us
            </p>
            <a
              href="mailto:hello@tryonai.com"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              cashishh38@gmail.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TryOnAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
