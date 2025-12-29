import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RegisterForm, GoogleButton } from "@/components/auth";

export default function RegisterPage() {
    return (
        <Card className="backdrop-blur-lg bg-white/80">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>
                    Get started with Smartphone Service today
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <GoogleButton text="Sign up with Google" />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-zinc-500">Or continue with</span>
                    </div>
                </div>

                <RegisterForm />

                <p className="text-center text-sm text-zinc-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-zinc-900 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>

                <p className="text-center text-xs text-zinc-500">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-zinc-700">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline hover:text-zinc-700">
                        Privacy Policy
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
