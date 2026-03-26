/**
 * Navbar.tsx
 *
 * Responsive top navigation for the app shell.
 */

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const links = [
	{ name: "Home", to: "/" },
	{ name: "Analyse", to: "/analyse" },
];

function linkClass(isActive: boolean) {
	return [
		"relative px-2 py-1 text-sm font-medium transition-colors",
		isActive ? "text-cyan-300" : "text-slate-200 hover:text-cyan-200",
	].join(" ");
}

function Navbar() {
	return (
		<Disclosure as="nav" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
			{({ open }) => (
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
					<NavLink to="/" className="inline-flex items-center gap-2 text-slate-100">
						<ShieldCheck className="h-5 w-5 text-cyan-300" />
						<span className="text-lg font-semibold tracking-tight">DeepVerify</span>
					</NavLink>

					<div className="hidden items-center gap-6 md:flex">
						{links.map((link) => (
							<NavLink key={link.to} to={link.to} className={({ isActive }) => linkClass(isActive)}>
								{({ isActive }) => (
									<>
										{link.name}
										{isActive ? (
											<motion.span
												layoutId="active-link"
												className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-cyan-300"
											/>
										) : null}
									</>
								)}
							</NavLink>
						))}
					</div>

					<DisclosureButton className="inline-flex items-center justify-center rounded-md border border-white/15 p-2 text-slate-200 md:hidden">
						<span className="sr-only">Open main menu</span>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</DisclosureButton>

					<DisclosurePanel className="absolute left-0 right-0 top-full border-b border-white/10 bg-slate-950/95 px-4 pb-4 pt-2 md:hidden">
						<div className="space-y-2">
							{links.map((link) => (
								<NavLink
									key={`mobile-${link.to}`}
									to={link.to}
									className={({ isActive }) =>
										[
											"block rounded-lg px-3 py-2 text-sm font-medium",
											isActive ? "bg-cyan-500/15 text-cyan-200" : "text-slate-200 hover:bg-white/5",
										].join(" ")
									}
								>
									{link.name}
								</NavLink>
							))}
						</div>
					</DisclosurePanel>
				</div>
			)}
		</Disclosure>
	);
}

export default Navbar;
